/**
 * Smoke DB (ticket 09): Acquisto Pacchetto residuo 1 → Ingresso OK → secondo reject;
 * Restrict su Acquisto/Prodotto/Cliente con messaggi utente-facing; cleanup.
 * Eseguire: npx tsx --env-file=.env scripts/smoke-entrance-flow.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import {
	NO_JUSTIFYING_PURCHASE_ERROR,
	registerEntrance,
} from "../src/data-access/entrances";
import { deletePurchase } from "../src/data-access/purchases";
import { deleteProduct } from "../src/data-access/products";
import { deleteClient } from "../src/data-access/clients";

const db = new PrismaClient();

const TAG = "ZZSMK09";

const EXPECTED = {
	purchase: "Impossibile eliminare l'acquisto: esistono ingressi collegati.",
	product: "Impossibile eliminare il prodotto: esistono acquisti collegati.",
	client: "Impossibile eliminare il cliente: esistono acquisti collegati.",
} as const;

async function cleanup() {
	const clients = await db.client.findMany({
		where: { taxCode: { startsWith: TAG } },
	});
	for (const c of clients) {
		const purchases = await db.purchase.findMany({ where: { clientId: c.id } });
		for (const p of purchases) {
			await db.entrance.deleteMany({ where: { purchaseId: p.id } });
		}
		await db.purchase.deleteMany({ where: { clientId: c.id } });
		await db.client.delete({ where: { id: c.id } });
	}
	await db.catalog.deleteMany({ where: { productCode: { startsWith: TAG } } });
	await db.membership.deleteMany({ where: { productCode: { startsWith: TAG } } });
	await db.entranceSet.deleteMany({ where: { productCode: { startsWith: TAG } } });
	await db.product.deleteMany({ where: { code: { startsWith: TAG } } });
}

async function assertRejects(
	label: string,
	fn: () => Promise<unknown>,
	expectedMessage: string
) {
	try {
		await fn();
		throw new Error(`${label}: expected reject`);
	} catch (e) {
		if (!(e instanceof Error) || e.message !== expectedMessage) {
			throw new Error(
				`${label}: expected "${expectedMessage}", got ${
					e instanceof Error ? e.message : String(e)
				}`
			);
		}
		console.log(`ok: Restrict ${label}`);
	}
}

async function main() {
	await cleanup();

	const pkgCode = `${TAG}-PKG`;
	await db.product.create({ data: { code: pkgCode } });
	await db.entranceSet.create({ data: { productCode: pkgCode, entranceNumber: 1 } });

	const client = await db.client.create({
		data: {
			taxCode: `${TAG}CF`,
			name: "Smoke",
			surname: "Flow",
			birthDate: new Date("1990-01-01"),
			street: "Via Test",
			houseNumber: "1",
			city: "Test",
			province: "TS",
			phoneNumber: "000",
			email: `${TAG.toLowerCase()}@example.com`,
			enrollmentDate: new Date(),
		},
	});

	const purchase = await db.purchase.create({
		data: {
			clientId: client.id,
			date: new Date("2026-07-01T12:00:00.000Z"),
			amount: new Prisma.Decimal("15.50"),
			productCode: pkgCode,
			duration: null,
			entranceNumber: 1,
		},
	});

	const at = new Date("2026-07-20T12:00:00.000Z");
	const e1 = await registerEntrance(client.id, at);
	if (e1.purchaseId !== purchase.id) {
		throw new Error(`expected purchase ${purchase.id}, got ${e1.purchaseId}`);
	}
	console.log("ok: Acquisto → Ingresso");

	let rejected = false;
	try {
		await registerEntrance(client.id, at);
	} catch (e) {
		rejected = e instanceof Error && e.message === NO_JUSTIFYING_PURCHASE_ERROR;
	}
	if (!rejected) throw new Error("expected reject at residual 0");
	console.log("ok: residuo esaurito → reject");

	await assertRejects("Acquisto", () => deletePurchase({ id: purchase.id }), EXPECTED.purchase);
	await assertRejects("Prodotto", () => deleteProduct({ code: pkgCode }), EXPECTED.product);
	await assertRejects("Cliente", () => deleteClient({ id: client.id }), EXPECTED.client);

	const stillClient = await db.client.findUnique({ where: { id: client.id } });
	if (!stillClient) throw new Error("cliente should still exist after Restrict");

	await cleanup();
	console.log("\nDB smoke entrance-flow (ticket 09) passed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
