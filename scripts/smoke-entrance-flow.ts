/**
 * Smoke: Acquisto Pacchetto residuo 1 → Ingresso OK; second Ingresso reject;
 * Restrict delete on Acquisto / Prodotto / Cliente with user-facing messages;
 * Decimal amount survives registration path.
 *
 * Run: npx tsx --env-file=.env scripts/smoke-entrance-flow.ts
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { Prisma, PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import {
	CLIENT_HAS_PURCHASES_MESSAGE,
	PRODUCT_HAS_PURCHASES_MESSAGE,
	PURCHASE_HAS_ENTRANCES_MESSAGE,
	rethrowRestrictDelete,
} from "../src/lib/domain/restrict-delete";
import {
	NO_JUSTIFYING_PURCHASE_ERROR,
	selectJustifyingPurchaseId,
	type PurchaseCandidate,
} from "../src/lib/domain/entrance-justification";
import { formatCatalogPrice } from "../src/lib/domain/catalog-price";

function parseDatabaseUrl(url: string) {
	const parsed = new URL(url);
	return {
		host: parsed.hostname,
		port: parsed.port ? Number(parsed.port) : 3306,
		user: decodeURIComponent(parsed.username),
		password: decodeURIComponent(parsed.password),
		database: parsed.pathname.replace(/^\//, ""),
	};
}

const adapter = new PrismaMariaDb(parseDatabaseUrl(process.env.DATABASE_URL!));
const db = new PrismaClient({ adapter });

async function registerEntrance(clientId: number, date?: Date) {
	const at = date ?? new Date();

	return await db.$transaction(
		async (tx) => {
			await tx.$queryRaw`
				SELECT \`id\` FROM \`acquisti\` WHERE \`id_cliente\` = ${clientId} FOR UPDATE
			`;

			const purchases = await tx.purchase.findMany({
				where: { clientId },
				include: { _count: { select: { entrances: true } } },
			});

			const candidates: PurchaseCandidate[] = purchases.map((p) => ({
				id: p.id,
				date: p.date,
				duration: p.duration,
				entranceNumber: p.entranceNumber,
				usedEntranceCount: p._count.entrances,
			}));

			const purchaseId = selectJustifyingPurchaseId(candidates, at);
			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.create({
				data: {
					date: at,
					purchaseId,
				},
				include: {
					purchase: true,
				},
			});
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
	);
}

async function expectReject(label: string, fn: () => Promise<unknown>, includes: string) {
	try {
		await fn();
		throw new Error(`${label}: expected rejection, but succeeded`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		assert.ok(message.includes(includes), `${label}: unexpected error: ${message}`);
		console.log(`OK  ${label}`);
	}
}

async function main() {
	const stamp = Date.now();
	const productCode = `SMOKE-PKG-${stamp}`;
	const year = new Date().getFullYear();

	console.log("smoke-entrance-flow: setup…");

	await db.product.create({ data: { code: productCode } });
	await db.entranceSet.create({
		data: { productCode, entranceNumber: 1 },
	});
	await db.catalog.create({
		data: {
			year,
			productCode,
			price: new Prisma.Decimal("25.00"),
		},
	});

	const client = await db.client.create({
		data: {
			name: "Smoke",
			surname: "Test",
			email: `smoke-${stamp}@example.com`,
			phoneNumber: "0000000000",
			birthDate: new Date("1990-01-01"),
			taxCode: `SMOKE${stamp}`.slice(0, 16),
			street: "Via Smoke",
			houseNumber: "1",
			city: "Test",
			province: "TS",
		},
	});

	const purchase = await db.purchase.create({
		data: {
			clientId: client.id,
			date: new Date(),
			amount: new Prisma.Decimal("25.00"),
			productCode,
			duration: null,
			entranceNumber: 1,
		},
	});

	// Live Product N changed after sale must not revive residual on sold Acquisto.
	await db.entranceSet.update({
		where: { productCode },
		data: { entranceNumber: 99 },
	});

	const entrance = await registerEntrance(client.id);
	assert.equal(entrance.purchaseId, purchase.id, "first Ingresso must attach to smoke Acquisto");
	assert.equal(
		formatCatalogPrice(entrance.purchase.amount),
		"25.00",
		"Entrance.purchase.amount Decimal formats for display"
	);
	console.log("OK  Acquisto → Ingresso (residuo 1 → 0)");

	await expectReject(
		"second Ingresso on exhausted Pacchetto",
		() => registerEntrance(client.id),
		"Nessun Acquisto giustifica"
	);

	await expectReject(
		"delete Acquisto with Ingressi",
		async () => {
			try {
				await db.purchase.delete({ where: { id: purchase.id } });
			} catch (error) {
				rethrowRestrictDelete(error, PURCHASE_HAS_ENTRANCES_MESSAGE);
			}
		},
		"Ingressi collegati"
	);

	await expectReject(
		"delete Prodotto with Acquisti",
		async () => {
			try {
				await db.product.delete({ where: { code: productCode } });
			} catch (error) {
				rethrowRestrictDelete(error, PRODUCT_HAS_PURCHASES_MESSAGE);
			}
		},
		"Acquisti collegati"
	);

	await expectReject(
		"delete Cliente with Acquisti",
		async () => {
			try {
				await db.client.delete({ where: { id: client.id } });
			} catch (error) {
				rethrowRestrictDelete(error, CLIENT_HAS_PURCHASES_MESSAGE);
			}
		},
		"Acquisti collegati"
	);

	await db.entrance.delete({ where: { id: entrance.id } });
	await db.purchase.delete({ where: { id: purchase.id } });
	await db.catalog.delete({
		where: { year_productCode: { year, productCode } },
	});
	await db.entranceSet.delete({ where: { productCode } });
	await db.product.delete({ where: { code: productCode } });
	await db.client.delete({ where: { id: client.id } });

	console.log("smoke-entrance-flow: all checks passed");
}

main()
	.catch((error) => {
		console.error("smoke-entrance-flow FAILED:", error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
