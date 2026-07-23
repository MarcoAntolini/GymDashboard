import { PrismaClient, ContractType } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockContracts(db: PrismaClient) {
  console.log("Mocking contracts...");
  const employees = await db.employee.findMany();

  for (const employee of employees) {
    const type = faker.helpers.arrayElement(Object.values(ContractType));
    await db.contract.create({
      data: {
        employeeId: employee.id,
        type,
        hourlyFee: faker.number.float({ min: 10, max: 50 }),
        startingDate: employee.hiringDate,
        // FixedTerm (determinato) always has end; OpenEnded (indeterminato) is in corso
        endingDate:
          type === ContractType.FixedTerm
            ? faker.date.future({ refDate: employee.hiringDate })
            : null,
      },
    });
  }

  console.log(`Created ${employees.length} mock contracts.`);
}
