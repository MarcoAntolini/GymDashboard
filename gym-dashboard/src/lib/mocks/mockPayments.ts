import { PrismaClient, PaymentType } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockPayments(db: PrismaClient) {
  console.log("Mocking payments...");
  const paymentsToCreate = 50;

  for (let i = 0; i < paymentsToCreate; i++) {
    await db.payment.create({
      data: {
        date: faker.date.recent(),
        amount: faker.number.float({ min: 100, max: 5000 }),
        type: faker.helpers.arrayElement(Object.values(PaymentType)),
      },
    });
  }

  console.log(`Created ${paymentsToCreate} mock payments.`);
}