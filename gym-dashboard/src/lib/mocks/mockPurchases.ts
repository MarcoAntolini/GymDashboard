import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient } from "@prisma/client";

export async function mockPurchases(db: PrismaClient) {
	console.log("Mocking purchases...");
	const clients = await db.client.findMany();
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true }
	});

	const specialized = products.filter((p) => p.membership || p.entranceSet);
	const purchasesToCreate = Math.min(20, specialized.length);
	const shuffledProducts = faker.helpers.shuffle([...specialized]);

	for (let i = 0; i < purchasesToCreate; i++) {
		const client = faker.helpers.arrayElement(clients);
		const product = shuffledProducts[i];
		const date = faker.date.past();
		const year = date.getFullYear();

		const catalog = await db.catalog.findUnique({
			where: {
				year_productCode: {
					year,
					productCode: product.code
				}
			}
		});

		const amount =
			catalog?.price ??
			new Prisma.Decimal(faker.commerce.price({ min: 10, max: 500, dec: 2 }));

		try {
			await db.purchase.create({
				data: {
					clientId: client.id,
					date,
					amount,
					productCode: product.code,
					membershipDuration: product.membership?.duration ?? null,
					entranceNumber: product.entranceSet?.entranceNumber ?? null
				}
			});
			console.log(`Created purchase ${i + 1} of ${purchasesToCreate}`);
		} catch (error) {
			console.error(`Error creating purchase for product ${product.code}:`, error);
		}
	}

	console.log(`Finished creating mock purchases.`);
}
