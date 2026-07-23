import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockEntranceSets(db: PrismaClient) {
  console.log("Mocking entrance sets...");
  const products = await db.product.findMany({ where: { membership: null } });

  for (const product of products) {
    await db.entranceSet.create({
      data: {
        productCode: product.code,
        entranceNumber: faker.number.int({ min: 5, max: 50 }),
      },
    });
  }

  console.log(`Created ${products.length} mock entrance sets.`);
}