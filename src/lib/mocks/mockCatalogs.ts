import { Prisma, PrismaClient } from "@prisma/client";
import { faker } from "./faker";

export async function mockCatalogs(db: PrismaClient) {
	console.log("Mocking catalogs...");
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true },
	});

	// Anni recenti così Acquisti trovano prezzo Listino (filtri/analytics).
	const currentYear = new Date().getFullYear();
	const years = [currentYear - 1, currentYear];

	let created = 0;
	for (const product of products) {
		if (!product.membership && !product.entranceSet) {
			continue;
		}

		for (const year of years) {
			await db.catalog.create({
				data: {
					year,
					productCode: product.code,
					price: new Prisma.Decimal(
						faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
					),
				},
			});
			created++;
		}
	}

	console.log(`Created ${created} mock catalogs.`);
}
