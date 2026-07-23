import { faker } from "@faker-js/faker";
import { PrismaClient } from "@prisma/client";

export async function mockPurchases(db: PrismaClient) {
	console.log("Mocking purchases...");
	const clients = await db.client.findMany();
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true },
	});

	const purchasesToCreate = Math.min(20, products.length);
	const shuffledProducts = faker.helpers.shuffle([...products]);

	for (let i = 0; i < purchasesToCreate; i++) {
		const client = faker.helpers.arrayElement(clients);
		const product = shuffledProducts[i];
		const duration = product.membership?.duration ?? null;
		const entranceNumber = product.entranceSet?.entranceNumber ?? null;

		if (duration == null && entranceNumber == null) {
			console.warn(`Skipping product ${product.code}: no specialization`);
			continue;
		}

		try {
			await db.purchase.create({
				data: {
					clientId: client.id,
					date: faker.date.past(),
					amount: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
					productCode: product.code,
					duration,
					entranceNumber,
				},
			});
			console.log(`Created purchase ${i + 1} of ${purchasesToCreate}`);
		} catch (error) {
			console.error(`Error creating purchase for product ${product.code}:`, error);
		}
	}

	console.log(`Finished creating mock purchases.`);
}
