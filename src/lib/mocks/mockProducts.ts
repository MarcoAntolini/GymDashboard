import { PrismaClient } from "@prisma/client";
import { MOCK_PRODUCTS } from "./scenario";

export async function mockProducts(db: PrismaClient) {
	console.log("Mocking products...");

	await db.product.createMany({
		data: MOCK_PRODUCTS.map(({ code }) => ({ code })),
	});

	console.log(`Created ${MOCK_PRODUCTS.length} mock products.`);
}
