import { PrismaClient } from "@prisma/client";
import { packageResidual } from "@/lib/domain/sale-access";
import { faker } from "./faker";

export async function mockEntrances(db: PrismaClient) {
	console.log("Mocking entrances...");
	const sales = await db.sale.findMany({
		where: { entranceNumber: { not: null } },
		include: { _count: { select: { entrance: true } } },
	});

	if (sales.length === 0) {
		console.log("No package sales found; skipping entrances.");
		return;
	}

	const residualById = new Map(
		sales.map((p) => [
			p.id,
			packageResidual(p, p._count.entrance) ?? 0,
		])
	);

	let created = 0;
	const attempts = 200;

	for (let i = 0; i < attempts; i++) {
		const available = sales.filter((p) => (residualById.get(p.id) ?? 0) > 0);
		if (available.length === 0) break;

		const sale = faker.helpers.arrayElement(available);
		await db.entrance.create({
			data: {
				saleId: sale.id,
				date: faker.date.recent(),
			},
		});
		residualById.set(sale.id, (residualById.get(sale.id) ?? 1) - 1);
		created++;
	}

	console.log(`Created ${created} mock entrances (residual-aware).`);
}
