import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockEquipment(db: PrismaClient) {
  console.log("Mocking equipment...");
  const payments = await db.payment.findMany({ where: { type: 'Equipment' } });

  for (const payment of payments) {
    await db.equipment.create({
      data: {
        paymentId: payment.id,
        description: faker.commerce.productName(),
        provider: faker.company.name(),
      },
    });
  }

  console.log(`Created ${payments.length} mock equipment entries.`);
}