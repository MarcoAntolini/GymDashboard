import { PrismaClient, ContractType } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockContracts(db: PrismaClient) {
  console.log("Mocking contracts...");
  const employees = await db.employee.findMany();

  for (const employee of employees) {
    await db.contract.create({
      data: {
        employeeId: employee.id,
        type: faker.helpers.arrayElement(Object.values(ContractType)),
        hourlyFee: faker.number.float({ min: 10, max: 50 }),
        startingDate: employee.hiringDate,
        endingDate: faker.datatype.boolean() ? faker.date.future() : null,
      },
    });
  }

  console.log(`Created ${employees.length} mock contracts.`);
}