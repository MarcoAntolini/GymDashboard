import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockBills(db: PrismaClient) {
  console.log("Mocking bills...");
  const payments = await db.payment.findMany({ where: { type: 'Bill' } });

  for (const payment of payments) {
    await db.bill.create({
      data: {
        paymentId: payment.id,
        description: faker.commerce.productName(),
        provider: faker.company.name(),
      },
    });
  }

  console.log(`Created ${payments.length} mock bills.`);
}