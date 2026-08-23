import { Prisma, PrismaClient } from "@prisma/client";
import { catalogPrice, MOCK_PRODUCTS, mockScenario } from "./scenario";

export async function mockCatalogs(db: PrismaClient) {
	console.log("Mocking catalogs...");
	const catalogs: Prisma.CatalogCreateManyInput[] = [];

	for (
		let year = mockScenario.firstCatalogYear;
		year <= mockScenario.currentYear;
		year++
	) {
		for (const product of MOCK_PRODUCTS) {
			catalogs.push({
				year,
				productCode: product.code,
				price: new Prisma.Decimal(catalogPrice(product.basePrice, year)),
			});
		}
	}

	await db.catalog.createMany({ data: catalogs });

	console.log(`Created ${catalogs.length} mock catalogs.`);
}
