import { PrismaClient } from "@prisma/client";
import { MOCK_PRODUCTS } from "./scenario";

export async function mockEntranceSets(db: PrismaClient) {
	console.log("Mocking entrance sets...");
	const entranceSets = MOCK_PRODUCTS.filter(
		(product) => product.kind === "entranceSet"
	);

	await db.entranceSet.createMany({
		data: entranceSets.map(({ code, entranceNumber }) => ({
			productCode: code,
			entranceNumber,
		})),
	});

	console.log(`Created ${entranceSets.length} mock entrance sets.`);
}