import { Prisma, PrismaClient, ContractType } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockContracts(db: PrismaClient) {
  console.log("Mocking contracts...");
  const employees = await db.employee.findMany();

  for (const employee of employees) {
    const type = faker.helpers.arrayElement(Object.values(ContractType));
    // OpenEnded → no end; FixedTerm → end after start (domain §7 / ticket 08)
    const endingDate =
      type === ContractType.OpenEnded
        ? null
        : faker.date.soon({ days: 365 * 2, refDate: employee.hiringDate });

    await db.contract.create({
      data: {
        employeeId: employee.id,
        type,
        hourlyFee: new Prisma.Decimal(
          faker.number.float({ min: 10, max: 50, fractionDigits: 2 })
        ),
        startingDate: employee.hiringDate,
        endingDate,
      },
    });
  }

  console.log(`Created ${employees.length} mock contracts.`);
}
