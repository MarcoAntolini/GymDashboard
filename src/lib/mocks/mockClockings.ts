import { PrismaClient } from "@prisma/client";
import { faker } from "@faker-js/faker";

export async function mockClockings(db: PrismaClient) {
  console.log("Mocking clockings...");
  const employees = await db.employee.findMany();

  const clockingsToCreate = 100;

  for (let i = 0; i < clockingsToCreate; i++) {
    const employee = faker.helpers.arrayElement(employees);
    const entranceTime = faker.date.recent();
    const exitTime = faker.date.between({ from: entranceTime, to: new Date() });

    await db.clocking.create({
      data: {
        employeeId: employee.id,
        entranceTime,
        exitTime,
      },
    });
  }

  console.log(`Created ${clockingsToCreate} mock clockings.`);
}