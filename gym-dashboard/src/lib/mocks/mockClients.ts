import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockClients(db: PrismaClient) {
  console.log("Mocking clients...");
  const clientsToCreate = 50;

  for (let i = 0; i < clientsToCreate; i++) {
    await db.client.create({
      data: {
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        email: faker.internet.email(),
        phoneNumber: faker.phone.number(),
        birthDate: faker.date.past({ years: 50 }),
        taxCode: faker.string.nanoid(16),
        street: faker.location.streetAddress(),
        houseNumber: faker.location.buildingNumber(),
        city: faker.location.city(),
        province: faker.location.state(),
        remainingEntrances: faker.number.int({ min: 10, max: 100 }),
      },
    });
  }

  console.log(`Created ${clientsToCreate} mock clients.`);
}