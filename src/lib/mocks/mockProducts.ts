import { PrismaClient } from "@prisma/client";
import { italianProductCode } from "./italian";

export async function mockProducts(db: PrismaClient) {
	console.log("Mocking products...");
	const productsToCreate = 40;

	for (let i = 0; i < productsToCreate; i++) {
		await db.product.create({
			data: {
				code: italianProductCode(i),
			},
		});
	}

	console.log(`Created ${productsToCreate} mock products.`);
}
