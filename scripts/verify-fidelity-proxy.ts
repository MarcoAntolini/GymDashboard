/**
 * Smoke: proxy fidelizzazione OLTP (ticket 54).
 * Esegui: npx tsx scripts/verify-fidelity-proxy.ts
 */
import assert from "node:assert/strict";
import {
	computeFidelityProxy,
	countActiveClients,
	countRenewals,
	FIDELITY_AT_RISK_DAYS,
	listAtRiskClients,
	type FidelitySaleInput,
} from "../src/lib/fidelity-proxy";

function d(iso: string) {
	return new Date(iso);
}

// Attivi: due Ingressi stesso Cliente + uno di un altro → 2 attivi.
{
	const count = countActiveClients(
		[
			{ clientId: 1, date: d("2024-03-10T10:00:00") },
			{ clientId: 1, date: d("2024-03-12T10:00:00") },
			{ clientId: 2, date: d("2024-03-11T10:00:00") },
			{ clientId: 3, date: d("2024-02-01T10:00:00") }, // fuori periodo
		],
		d("2024-03-01"),
		d("2024-03-31")
	);
	assert.equal(count, 2);
}

// Rinnovi: secondo Vendita nel periodo conta; primo no.
{
	const { renewalsCount, renewingClientsCount } = countRenewals(
		[
			{ clientId: 1, date: d("2024-01-01") },
			{ clientId: 1, date: d("2024-03-15") },
			{ clientId: 2, date: d("2024-03-10") }, // prima vendita
			{ clientId: 3, date: d("2023-06-01") },
			{ clientId: 3, date: d("2024-03-20") },
		],
		d("2024-03-01"),
		d("2024-03-31")
	);
	assert.equal(renewalsCount, 2);
	assert.equal(renewingClientsCount, 2);
}

const membershipSale = (over: Partial<FidelitySaleInput> & Pick<FidelitySaleInput, "id" | "clientId" | "date" | "duration">): FidelitySaleInput => ({
	entranceNumber: null,
	entrancesLinked: 0,
	...over,
});

const packageSale = (over: Partial<FidelitySaleInput> & Pick<FidelitySaleInput, "id" | "clientId" | "date" | "entranceNumber" | "entrancesLinked">): FidelitySaleInput => ({
	duration: null,
	...over,
});

// A rischio: abbonamento valido, nessun Ingresso da ≥ N giorni.
{
	const asOf = d("2024-03-30T12:00:00");
	const sales = [
		membershipSale({
			id: 1,
			clientId: 10,
			date: d("2024-03-01"),
			duration: 60,
		}),
	];
	const atRisk = listAtRiskClients({
		clients: [{ id: 10, name: "Anna", surname: "Bianchi" }],
		sales,
		entrances: [{ clientId: 10, date: d("2024-03-01T09:00:00") }],
		entrancesBySaleId: new Map(),
		asOf,
		atRiskDays: FIDELITY_AT_RISK_DAYS,
	});
	assert.equal(atRisk.length, 1);
	assert.equal(atRisk[0]?.titleStatus, "valid");
	assert.ok((atRisk[0]?.daysSinceLastEntrance ?? 0) >= FIDELITY_AT_RISK_DAYS);
}

// Non a rischio: Ingresso recente.
{
	const asOf = d("2024-03-30T12:00:00");
	const atRisk = listAtRiskClients({
		clients: [{ id: 11, name: "Luca", surname: "Verdi" }],
		sales: [
			membershipSale({
				id: 2,
				clientId: 11,
				date: d("2024-03-01"),
				duration: 60,
			}),
		],
		entrances: [{ clientId: 11, date: d("2024-03-28T09:00:00") }],
		entrancesBySaleId: new Map(),
		asOf,
	});
	assert.equal(atRisk.length, 0);
}

// A rischio: abbonamento scaduto di recente, silenzio lungo.
{
	const asOf = d("2024-03-30T12:00:00");
	const atRisk = listAtRiskClients({
		clients: [{ id: 12, name: "Mia", surname: "Neri" }],
		sales: [
			membershipSale({
				id: 3,
				clientId: 12,
				date: d("2024-02-20"),
				duration: 30, // fine esclusiva ~ 2024-03-21
			}),
		],
		entrances: [{ clientId: 12, date: d("2024-02-21T09:00:00") }],
		entrancesBySaleId: new Map(),
		asOf,
	});
	assert.equal(atRisk.length, 1);
	assert.equal(atRisk[0]?.titleStatus, "recently_expired");
}

// A rischio: pacchetto esaurito di recente (ultimo ingresso nel window).
{
	const asOf = d("2024-03-30T12:00:00");
	const saleId = 4;
	const atRisk = listAtRiskClients({
		clients: [{ id: 13, name: "Leo", surname: "Rossi" }],
		sales: [
			packageSale({
				id: saleId,
				clientId: 13,
				date: d("2024-01-01"),
				entranceNumber: 2,
				entrancesLinked: 2,
			}),
		],
		entrances: [
			{ clientId: 13, date: d("2024-01-05T09:00:00") },
			{ clientId: 13, date: d("2024-03-25T09:00:00") },
		],
		entrancesBySaleId: new Map([
			[saleId, [d("2024-01-05T09:00:00"), d("2024-03-25T09:00:00")]],
		]),
		asOf,
	});
	// daysSince last entrance = 5 < 14 → non a rischio per silenzio
	assert.equal(atRisk.length, 0);
}

// Pacchetto esaurito + silenzio ≥ N → a rischio recently_expired.
{
	const asOf = d("2024-03-30T12:00:00");
	const saleId = 5;
	const atRisk = listAtRiskClients({
		clients: [{ id: 14, name: "Eva", surname: "Blu" }],
		sales: [
			packageSale({
				id: saleId,
				clientId: 14,
				date: d("2024-01-01"),
				entranceNumber: 1,
				entrancesLinked: 1,
			}),
		],
		entrances: [{ clientId: 14, date: d("2024-03-10T09:00:00") }],
		entrancesBySaleId: new Map([[saleId, [d("2024-03-10T09:00:00")]]]),
		asOf,
	});
	assert.equal(atRisk.length, 1);
	assert.equal(atRisk[0]?.titleStatus, "recently_expired");
}

// computeFidelityProxy aggrega i tre indicatori.
{
	const from = d("2024-03-01");
	const to = d("2024-03-31T23:59:59");
	const result = computeFidelityProxy({
		clients: [
			{ id: 1, name: "A", surname: "A" },
			{ id: 2, name: "B", surname: "B" },
		],
		sales: [
			membershipSale({ id: 1, clientId: 1, date: d("2024-01-01"), duration: 90 }),
			membershipSale({ id: 2, clientId: 1, date: d("2024-03-10"), duration: 30 }),
			membershipSale({ id: 3, clientId: 2, date: d("2024-03-05"), duration: 60 }),
		],
		entrances: [
			{ clientId: 1, date: d("2024-03-12T10:00:00") },
			{ clientId: 2, date: d("2024-03-06T10:00:00") },
		],
		entrancesBySaleId: new Map(),
		from,
		to,
		asOf: d("2024-03-31"),
	});
	assert.equal(result.activeClientsCount, 2);
	assert.equal(result.renewalsCount, 1);
	assert.equal(result.renewingClientsCount, 1);
	assert.equal(result.atRiskDays, FIDELITY_AT_RISK_DAYS);
}

console.log("verify-fidelity-proxy: ok");
