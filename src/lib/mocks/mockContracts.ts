import { Prisma, PrismaClient, ContractType } from "@prisma/client";
import { faker } from "@faker-js/faker";
import { normalizeContractEndingDate } from "../domain/contract-term";

export async function mockContracts(db: PrismaClient) {
  console.log("Mocking contracts...");
  const employees = await db.employee.findMany();

  for (const employee of employees) {
    const type = faker.helpers.arrayElement(Object.values(ContractType));
    const endingDate = normalizeContractEndingDate(
      type,
      type === ContractType.FixedTerm ? faker.date.future({ refDate: employee.hiringDate }) : null
    );
    await db.contract.create({
      data: {
        employeeId: employee.id,
        type,
        hourlyFee: new Prisma.Decimal(
          faker.commerce.price({ min: 10, max: 50, dec: 2 })
        ),
        startingDate: employee.hiringDate,
        endingDate,
      },
    });
  }

  console.log(`Created ${employees.length} mock contracts.`);
}