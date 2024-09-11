import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockInterventions(db: PrismaClient) {
  console.log("Mocking interventions...");
  const payments = await db.payment.findMany({ where: { type: 'Intervention' } });

  for (const payment of payments) {
    const startingTime = faker.date.recent();
    const endingTime = faker.date.between({ from: startingTime, to: new Date() });

    await db.intervention.create({
      data: {
        paymentId: payment.id,
        description: faker.lorem.sentence(),
        maker: faker.company.name(),
        startingTime,
        endingTime,
      },
    });
  }

  console.log(`Created ${payments.length} mock interventions.`);
}