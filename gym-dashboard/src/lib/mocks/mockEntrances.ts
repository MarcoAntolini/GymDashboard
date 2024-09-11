import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockEntrances(db: PrismaClient) {
  console.log("Mocking entrances...");
  const clients = await db.client.findMany();

  const entrancesToCreate = 200;

  for (let i = 0; i < entrancesToCreate; i++) {
    const client = faker.helpers.arrayElement(clients);

    await db.entrance.create({
      data: {
        clientId: client.id,
        date: faker.date.recent(),
      },
    });
  }

  console.log(`Created ${entrancesToCreate} mock entrances.`);
}