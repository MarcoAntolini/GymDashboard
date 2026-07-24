import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockEntrances(db: PrismaClient) {
	console.log("Mocking entrances...");
	const purchases = await db.purchase.findMany({
		where: { entranceNumber: { not: null } },
	});

	if (purchases.length === 0) {
		console.log("No package purchases found; skipping entrances.");
		return;
	}

	const entrancesToCreate = 200;

	for (let i = 0; i < entrancesToCreate; i++) {
		const purchase = faker.helpers.arrayElement(purchases);

		await db.entrance.create({
			data: {
				purchaseId: purchase.id,
				date: faker.date.recent(),
			},
		});
	}

	console.log(`Created ${entrancesToCreate} mock entrances.`);
}
