import { PrismaClient, Role } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockAccounts(db: PrismaClient) {
  console.log("Mocking accounts...");
  const employees = await db.employee.findMany();

  for (const employee of employees) {
    await db.account.create({
      data: {
        username: faker.internet.userName(),
        password: faker.internet.password(),
        role: faker.helpers.arrayElement(Object.values(Role)),
        approved: faker.datatype.boolean(),
        employeeId: employee.id,
      },
    });
  }

  console.log(`Created ${employees.length} mock accounts.`);
}