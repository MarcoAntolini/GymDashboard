import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { packageResidual } from "@/lib/domain/purchase-access";

export async function mockEntrances(db: PrismaClient) {
	console.log("Mocking entrances...");
	const purchases = await db.purchase.findMany({
		where: { entranceNumber: { not: null } },
		include: { _count: { select: { entrance: true } } },
	});

	if (purchases.length === 0) {
		console.log("No package purchases found; skipping entrances.");
		return;
	}

	const residualById = new Map(
		purchases.map((p) => [
			p.id,
			packageResidual(p, p._count.entrance) ?? 0,
		])
	);

	let created = 0;
	const attempts = 200;

	for (let i = 0; i < attempts; i++) {
		const available = purchases.filter((p) => (residualById.get(p.id) ?? 0) > 0);
		if (available.length === 0) break;

		const purchase = faker.helpers.arrayElement(available);
		await db.entrance.create({
			data: {
				purchaseId: purchase.id,
				date: faker.date.recent(),
			},
		});
		residualById.set(purchase.id, (residualById.get(purchase.id) ?? 1) - 1);
		created++;
	}

	console.log(`Created ${created} mock entrances (residual-aware).`);
}
