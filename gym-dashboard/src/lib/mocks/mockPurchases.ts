import { faker } from "@faker-js/faker";
import { PrismaClient, PurchaseType } from "@prisma/client";

export async function mockPurchases(db: PrismaClient) {
	console.log("Mocking purchases...");
	const clients = await db.client.findMany();
	const products = await db.product.findMany({ include: { membership: true, entranceSet: true } });

	const purchasesToCreate = Math.min(20, products.length);
	const shuffledProducts = faker.helpers.shuffle([...products]);

	for (let i = 0; i < purchasesToCreate; i++) {
		const client = faker.helpers.arrayElement(clients);
		const product = shuffledProducts[i];

		const type = product.membership ? PurchaseType.Membership : PurchaseType.EntranceSet;

		try {
			await db.purchase.create({
				data: {
					clientId: client.id,
					date: faker.date.past(),
					amount: faker.number.float({ min: 10, max: 500 }),
					type,
					productCode: product.code,
				},
			});
			console.log(`Created purchase ${i + 1} of ${purchasesToCreate}`);
		} catch (error) {
			console.error(`Error creating purchase for product ${product.code}:`, error);
		}
	}

	console.log(`Finished creating mock purchases.`);
}
