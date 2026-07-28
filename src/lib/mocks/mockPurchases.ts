import { Prisma, PrismaClient } from "@prisma/client";
import { snapshotFromProduct } from "@/lib/domain/purchase-access";
import { faker } from "./faker";

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
		const snapshot = snapshotFromProduct(product);
		const date = faker.date.past({ years: 1 });
		const catalog = await db.catalog.findUnique({
			where: {
				year_productCode: {
					year: date.getFullYear(),
					productCode: product.code,
				},
			},
		});
		const amount =
			catalog?.price ??
			new Prisma.Decimal(faker.number.float({ min: 10, max: 500, fractionDigits: 2 }));

		try {
			await db.purchase.create({
				data: {
					clientId: client.id,
					date,
					amount,
					productCode: product.code,
					duration: snapshot.duration,
					entranceNumber: snapshot.entranceNumber,
				},
			});
			console.log(`Created purchase ${i + 1} of ${purchasesToCreate}`);
		} catch (error) {
			console.error(`Error creating purchase for product ${product.code}:`, error);
		}
	}

	console.log(`Finished creating mock purchases.`);
}
