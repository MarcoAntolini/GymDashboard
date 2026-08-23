import { PrismaClient } from "@prisma/client";
import { MOCK_PRODUCTS } from "./scenario";

export async function mockMemberships(db: PrismaClient) {
	console.log("Mocking memberships...");
	const memberships = MOCK_PRODUCTS.filter(
		(product) => product.kind === "membership"
	);

	await db.membership.createMany({
		data: memberships.map(({ code, duration }) => ({
			productCode: code,
			duration,
		})),
	});

	console.log(`Created ${memberships.length} mock memberships.`);
}