import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockEmployees(db: PrismaClient) {
  console.log("Mocking employees...");
  const employeesToCreate = 20;

  for (let i = 0; i < employeesToCreate; i++) {
    await db.employee.create({
      data: {
        taxCode: faker.string.alphanumeric(16).toUpperCase(),
        name: faker.person.firstName(),
        surname: faker.person.lastName(),
        birthDate: faker.date.past({ years: 50 }),
        street: faker.location.street(),
        houseNumber: faker.location.buildingNumber(),
        city: faker.location.city(),
        province: faker.location.state(),
        phoneNumber: faker.phone.number(),
        email: faker.internet.email(),
        hiringDate: faker.date.past({ years: 5 }),
      },
    });
  }

  console.log(`Created ${employeesToCreate} mock employees.`);
}