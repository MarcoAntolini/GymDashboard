/**
 * Verifica di integrazione del dataset demo.
 * Run: npx tsx --env-file=.env scripts/verify-mock-dataset.ts
 */
import { startOfMonth, subDays } from "date-fns";
import { db } from "../src/lib/db";
import { MOCK_PAYMENT_TYPE } from "../src/lib/mocks/prisma-enums";
import { mockScenario } from "../src/lib/mocks/scenario";

function assert(condition: unknown, message: string): asserts condition {
	if (!condition) throw new Error(message);
}

function countValue(rows: Array<{ count: bigint | number }>): number {
	return Number(rows[0]?.count ?? 0);
}

async function main() {
	const now = mockScenario.now;
	const currentMonth = startOfMonth(now);
	const last30Days = subDays(now, 29);

	const [clients, employees, sales, entrances, clockings, payments] = await Promise.all([
		db.client.count(),
		db.employee.count(),
		db.sale.count(),
		db.entrance.count(),
		db.clocking.count(),
		db.payment.count(),
	]);

	assert(clients >= 900, `Clienti insufficienti: ${clients}`);
	assert(employees >= 20 && employees <= 30, `Organico non plausibile: ${employees}`);
	assert(sales >= 5_000, `Vendite insufficienti: ${sales}`);
	assert(entrances >= 60_000, `Ingressi insufficienti: ${entrances}`);
	assert(clockings >= 15_000, `Timbrature insufficienti: ${clockings}`);
	assert(payments >= 1_300, `Pagamenti insufficienti: ${payments}`);

	const [currentSales, recentSales, currentEntrances, recentEntrances, currentPayments] =
		await Promise.all([
			db.sale.count({ where: { date: { gte: currentMonth, lte: now } } }),
			db.sale.count({ where: { date: { gte: last30Days, lte: now } } }),
			db.entrance.count({ where: { date: { gte: currentMonth, lte: now } } }),
			db.entrance.count({ where: { date: { gte: last30Days, lte: now } } }),
			db.payment.count({ where: { date: { gte: currentMonth, lte: now } } }),
		]);

	assert(currentSales >= 20, `Vendite mese corrente insufficienti: ${currentSales}`);
	assert(recentSales >= 30, `Vendite ultimi 30 giorni insufficienti: ${recentSales}`);
	assert(currentEntrances >= 100, `Ingressi mese corrente insufficienti: ${currentEntrances}`);
	assert(recentEntrances >= 200, `Ingressi ultimi 30 giorni insufficienti: ${recentEntrances}`);
	assert(currentPayments >= 10, `Pagamenti mese corrente insufficienti: ${currentPayments}`);

	const [
		salesBeforeEnrollment,
		entrancesBeforeSale,
		membershipEntrancesAfterExpiry,
		overdrawnPackages,
		futureRows,
	] = await Promise.all([
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) AS count
			FROM vendite v
			JOIN clienti c ON c.id = v.id_cliente
			WHERE v.data < c.data_iscrizione
		`,
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) AS count
			FROM ingressi i
			JOIN vendite v ON v.id = i.id_vendita
			WHERE i.data < v.data
		`,
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) AS count
			FROM ingressi i
			JOIN vendite v ON v.id = i.id_vendita
			WHERE v.durata IS NOT NULL
				AND i.data > DATE_ADD(v.data, INTERVAL v.durata DAY)
		`,
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) AS count
			FROM (
				SELECT v.id
				FROM vendite v
				JOIN ingressi i ON i.id_vendita = v.id
				WHERE v.numero_ingressi IS NOT NULL
				GROUP BY v.id, v.numero_ingressi
				HAVING COUNT(i.id) > v.numero_ingressi
			) AS overdrawn
		`,
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT (
				(SELECT COUNT(*) FROM vendite WHERE data > NOW()) +
				(SELECT COUNT(*) FROM ingressi WHERE data > NOW()) +
				(SELECT COUNT(*) FROM pagamenti WHERE data > NOW()) +
				(SELECT COUNT(*) FROM timbrature WHERE entrata > NOW())
			) AS count
		`,
	]);

	assert(countValue(salesBeforeEnrollment) === 0, "Esistono vendite precedenti all'iscrizione");
	assert(countValue(entrancesBeforeSale) === 0, "Esistono ingressi precedenti alla vendita");
	assert(
		countValue(membershipEntrancesAfterExpiry) === 0,
		"Esistono ingressi successivi alla scadenza dell'abbonamento"
	);
	assert(countValue(overdrawnPackages) === 0, "Esistono pacchetti con ingressi oltre il plafond");
	assert(countValue(futureRows) === 0, "Esistono movimenti futuri");

	const [saleKinds, paymentTypes, orphanPayments] = await Promise.all([
		db.sale.groupBy({
			by: ["duration", "entranceNumber"],
			where: { date: { gte: currentMonth, lte: now } },
			_count: true,
		}),
		db.payment.groupBy({
			by: ["type"],
			where: { date: { gte: last30Days, lte: now } },
			_count: true,
		}),
		db.$queryRaw<Array<{ count: bigint }>>`
			SELECT COUNT(*) AS count
			FROM pagamenti p
			LEFT JOIN stipendi s ON s.id_pagamento = p.id
			LEFT JOIN bollette b ON b.id_pagamento = p.id
			LEFT JOIN attrezzature a ON a.id_pagamento = p.id
			LEFT JOIN interventi i ON i.id_pagamento = p.id
			WHERE
				(CASE WHEN s.id_pagamento IS NULL THEN 0 ELSE 1 END) +
				(CASE WHEN b.id_pagamento IS NULL THEN 0 ELSE 1 END) +
				(CASE WHEN a.id_pagamento IS NULL THEN 0 ELSE 1 END) +
				(CASE WHEN i.id_pagamento IS NULL THEN 0 ELSE 1 END) <> 1
		`,
	]);

	assert(
		saleKinds.some((row) => row.duration !== null) &&
			saleKinds.some((row) => row.entranceNumber !== null),
		"Il mese corrente non copre entrambi i tipi di vendita"
	);
	for (const type of Object.values(MOCK_PAYMENT_TYPE)) {
		assert(
			paymentTypes.some((row) => row.type === type),
			`Gli ultimi 30 giorni non contengono pagamenti ${type}`
		);
	}
	assert(countValue(orphanPayments) === 0, "Alcuni pagamenti non hanno una sola specializzazione");

	console.log("verify-mock-dataset: OK", {
		clients,
		employees,
		sales,
		entrances,
		clockings,
		payments,
		currentSales,
		currentEntrances,
		currentPayments,
	});
}

main()
	.catch((error) => {
		console.error(error);
		process.exitCode = 1;
	})
	.finally(() => db.$disconnect());
