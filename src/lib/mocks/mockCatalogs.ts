import { faker } from "@faker-js/faker";
import { PrismaClient, PurchaseType } from "@prisma/client";

export async function mockCatalogs(db: PrismaClient) {
	console.log("Mocking catalogs...");
	const products = await db.product.findMany();
	const memberships = await db.membership.findMany();
	const entranceSets = await db.entranceSet.findMany();

	for (const product of products) {
		const type = memberships.find((membership) => membership.productCode === product.code)
			? PurchaseType.Membership
			: entranceSets.find((entranceSet) => entranceSet.productCode === product.code)
			? PurchaseType.EntranceSet
			: null;

		if (type === null) {
			continue;
		}

		await db.catalog.create({
			data: {
				year: faker.date.past({ years: 10 }).getFullYear(),
				type,
				productCode: product.code,
				price: faker.number.float({ min: 10, max: 500 }),
			},
		});
	}

	console.log(`Created ${products.length} mock catalogs.`);
}
