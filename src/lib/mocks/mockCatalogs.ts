import { faker } from "@faker-js/faker";
import { Prisma, PrismaClient } from "@prisma/client";

export async function mockCatalogs(db: PrismaClient) {
	console.log("Mocking catalogs...");
	const products = await db.product.findMany({
		include: {
			membership: true,
			entranceSet: true,
		},
	});

	let created = 0;
	for (const product of products) {
		const hasMembership = product.membership != null;
		const hasEntranceSet = product.entranceSet != null;
		// Only list products with exactly one specialization (no tipo on Listino).
		if (hasMembership === hasEntranceSet) {
			continue;
		}

		await db.catalog.create({
			data: {
				year: faker.date.past({ years: 10 }).getFullYear(),
				productCode: product.code,
				price: new Prisma.Decimal(
					faker.commerce.price({ min: 10, max: 500, dec: 2 })
				),
			},
		});
		created += 1;
	}

	console.log(`Created ${created} mock catalogs.`);
}
