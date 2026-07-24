import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient } from "@prisma/client";

export async function mockCatalogs(db: PrismaClient) {
	console.log("Mocking catalogs...");
	const products = await db.product.findMany({
		include: { membership: true, entranceSet: true },
	});

	let created = 0;
	for (const product of products) {
		if (!product.membership && !product.entranceSet) {
			continue;
		}

		await db.catalog.create({
			data: {
				year: faker.date.past({ years: 10 }).getFullYear(),
				productCode: product.code,
				price: new Prisma.Decimal(
					faker.number.float({ min: 10, max: 500, fractionDigits: 2 })
				),
			},
		});
		created++;
	}

	console.log(`Created ${created} mock catalogs.`);
}
