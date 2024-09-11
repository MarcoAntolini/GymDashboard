import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockSalaries(db: PrismaClient) {
  console.log("Mocking salaries...");
  const employees = await db.employee.findMany();
  const payments = await db.payment.findMany({ where: { type: 'Salary' } });

  for (const payment of payments) {
    await db.salary.create({
      data: {
        paymentId: payment.id,
        employeeId: faker.helpers.arrayElement(employees).id,
      },
    });
  }

  console.log(`Created ${payments.length} mock salaries.`);
}