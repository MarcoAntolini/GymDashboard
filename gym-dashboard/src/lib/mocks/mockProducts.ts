import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockProducts(db: PrismaClient) {
  console.log("Mocking products...");
  const productsToCreate = 40;

  for (let i = 0; i < productsToCreate; i++) {
    await db.product.create({
      data: {
        code: faker.string.alphanumeric(8).toUpperCase(),
      },
    });
  }

  console.log(`Created ${productsToCreate} mock products.`);
}