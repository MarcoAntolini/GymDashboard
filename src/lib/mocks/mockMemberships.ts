import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockMemberships(db: PrismaClient) {
  console.log("Mocking memberships...");
  const products = await db.product.findMany();

  for (const product of products.slice(0, 10)) {
    await db.membership.create({
      data: {
        productCode: product.code,
        duration: faker.number.int({ min: 30, max: 365 }),
      },
    });
  }

  console.log(`Created ${products.slice(0, 10).length} mock memberships.`);
}