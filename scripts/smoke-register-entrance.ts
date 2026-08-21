/**
 * Smoke DB: registerEntrance membership preferito, FIFO pacchetto, reject residuo 0.
 * Eseguire: npx tsx scripts/smoke-register-entrance.ts
 */
import { PrismaClient, Prisma } from "@prisma/client";
import { registerEntrance } from "../src/data-access/entrances";
import { NO_JUSTIFYING_SALE_ERROR } from "../src/lib/entrance-justification";

const db = new PrismaClient();

async function cleanup(tag: string) {
	const clients = await db.client.findMany({
		where: { taxCode: { startsWith: tag } },
	});
	for (const c of clients) {
		const sales = await db.sale.findMany({ where: { clientId: c.id } });
		for (const p of sales) {
			await db.entrance.deleteMany({ where: { saleId: p.id } });
		}
		await db.sale.deleteMany({ where: { clientId: c.id } });
		await db.client.delete({ where: { id: c.id } });
	}
}

async function ensureProduct(code: string, kind: "m" | "p", n: number) {
	const existing = await db.product.findUnique({
		where: { code },
		include: { membership: true, entranceSet: true },
	});
	if (existing) return existing;
	await db.product.create({ data: { code } });
	if (kind === "m") {
		await db.membership.create({ data: { productCode: code, duration: n } });
	} else {
		await db.entranceSet.create({ data: { productCode: code, entranceNumber: n } });
	}
	return db.product.findUniqueOrThrow({
		where: { code },
		include: { membership: true, entranceSet: true },
	});
}

async function main() {
	const TAG = "ZZSMK06";
	await cleanup(TAG);

	const memCode = `${TAG}-MEM`;
	const pkgCode = `${TAG}-PKG`;
	await ensureProduct(memCode, "m", 30);
	await ensureProduct(pkgCode, "p", 1);

	const client = await db.client.create({
		data: {
			taxCode: `${TAG}CF`,
			name: "Smoke",
			surname: "Ingresso",
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

	const at = new Date("2026-07-20T12:00:00.000Z");

	const pkg = await db.sale.create({
		data: {
			clientId: client.id,
			date: new Date("2026-07-01T12:00:00.000Z"),
			amount: new Prisma.Decimal("10.00"),
			productCode: pkgCode,
			duration: null,
			entranceNumber: 1,
		},
	});

	const mem = await db.sale.create({
		data: {
			clientId: client.id,
			date: new Date("2026-07-10T12:00:00.000Z"),
			amount: new Prisma.Decimal("50.00"),
			productCode: memCode,
			duration: 30,
			entranceNumber: null,
		},
	});

	const e1 = await registerEntrance(client.id, at);
	if (e1.saleId !== mem.id) {
		throw new Error(`expected membership sale ${mem.id}, got ${e1.saleId}`);
	}
	console.log("ok: membership preferred");

	await db.entrance.delete({ where: { id: e1.id } });
	await db.sale.delete({ where: { id: mem.id } });

	const e2 = await registerEntrance(client.id, at);
	if (e2.saleId !== pkg.id) {
		throw new Error(`expected package ${pkg.id}, got ${e2.saleId}`);
	}
	console.log("ok: package FIFO when no membership");

	let rejected = false;
	try {
		await registerEntrance(client.id, at);
	} catch (e) {
		rejected =
			e instanceof Error && e.message.includes("Nessuna vendita giustifica");
	}
	if (!rejected) throw new Error("expected reject at residual 0");
	console.log("ok: reject residuo 0");
	console.log("message constant:", NO_JUSTIFYING_SALE_ERROR);

	await cleanup(TAG);
	console.log("\nDB smoke registerEntrance passed.");
}

main()
	.catch((e) => {
		console.error(e);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
