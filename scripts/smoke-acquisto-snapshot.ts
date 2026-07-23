/**
 * Smoke: create Acquisto snapshots durata/N; product update does not rewrite them;
 * residuo reads snapshot.
 */
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
import {
	canJustifyEntranceAt,
	remainingEntrancesForPurchase,
} from "../src/lib/domain/purchase-snapshot";

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

async function main() {
	const suffix = Date.now().toString(36);
	const client = await db.client.create({
		data: {
			taxCode: `SNAP${suffix}`,
			name: "Snapshot",
			surname: "Test",
			birthDate: new Date("1990-01-01"),
			street: "Via Test",
			houseNumber: "1",
			city: "Roma",
			province: "RM",
			phoneNumber: "3330000000",
			email: `snap-${suffix}@example.com`,
		},
	});

	const membershipCode = `ABB-SNAP-${suffix}`;
	await db.product.create({ data: { code: membershipCode } });
	await db.membership.create({ data: { productCode: membershipCode, duration: 30 } });

	const packCode = `PAC-SNAP-${suffix}`;
	await db.product.create({ data: { code: packCode } });
	await db.entranceSet.create({ data: { productCode: packCode, entranceNumber: 10 } });

	const soldAt = new Date("2026-02-01T10:00:00.000Z");
	const membershipPurchase = await db.purchase.create({
		data: {
			clientId: client.id,
			date: soldAt,
			amount: 50,
			productCode: membershipCode,
			duration: 30,
			entranceNumber: null,
		},
	});
	const packPurchase = await db.purchase.create({
		data: {
			clientId: client.id,
			date: soldAt,
			amount: 40,
			productCode: packCode,
			duration: null,
			entranceNumber: 10,
		},
	});

	// Live product values change — Acquisti must keep sale snapshots
	await db.membership.update({
		where: { productCode: membershipCode },
		data: { duration: 365 },
	});
	await db.entranceSet.update({
		where: { productCode: packCode },
		data: { entranceNumber: 99 },
	});

	const refreshedMembership = await db.purchase.findUniqueOrThrow({
		where: { id: membershipPurchase.id },
	});
	const refreshedPack = await db.purchase.findUniqueOrThrow({
		where: { id: packPurchase.id },
	});

	assert.equal(refreshedMembership.duration, 30);
	assert.equal(refreshedPack.entranceNumber, 10);

	assert.equal(
		canJustifyEntranceAt(
			{
				date: refreshedMembership.date,
				duration: refreshedMembership.duration,
				entranceNumber: refreshedMembership.entranceNumber,
			},
			new Date("2026-02-15T10:00:00.000Z"),
			0
		),
		true
	);
	// Would be valid if we wrongly used live product duration 365
	assert.equal(
		canJustifyEntranceAt(
			{
				date: refreshedMembership.date,
				duration: refreshedMembership.duration,
				entranceNumber: refreshedMembership.entranceNumber,
			},
			new Date("2026-06-01T10:00:00.000Z"),
			0
		),
		false
	);

	assert.equal(remainingEntrancesForPurchase(refreshedPack, 2), 8);
	// Live product is 99 — must not be used
	assert.notEqual(remainingEntrancesForPurchase(refreshedPack, 2), 97);

	console.log("OK: snapshot durata/N survives product updates; residuo/validità use snapshot");
}

main()
	.catch((err) => {
		console.error(err);
		process.exitCode = 1;
	})
	.finally(async () => {
		await db.$disconnect();
	});
