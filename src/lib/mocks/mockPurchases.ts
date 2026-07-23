import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient } from "@prisma/client";

export async function mockPurchases(db: PrismaClient) {
	console.log("Mocking purchases...");
	const clients = await db.client.findMany();
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true },
	});
	const catalogs = await db.catalog.findMany();

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

		const catalogForProduct = catalogs.filter((c) => c.productCode === product.code);
		let date: Date;
		let amount: Prisma.Decimal;

		if (catalogForProduct.length > 0) {
			const catalog = faker.helpers.arrayElement(catalogForProduct);
			date = faker.date.between({
				from: new Date(catalog.year, 0, 1),
				to: new Date(catalog.year, 11, 31, 23, 59, 59),
			});
			amount = catalog.price;
		} else {
			date = faker.date.past();
			amount = new Prisma.Decimal(faker.commerce.price({ min: 10, max: 500, dec: 2 }));
		}

		try {
			await db.purchase.create({
				data: {
					clientId: client.id,
					date,
					amount,
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
