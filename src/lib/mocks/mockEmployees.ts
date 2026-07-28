import { PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	fakeCodiceFiscale,
	italianPhone,
	italianProvince,
} from "./italian";

export async function mockEmployees(db: PrismaClient) {
	console.log("Mocking employees...");
	const employeesToCreate = 20;

	for (let i = 0; i < employeesToCreate; i++) {
		const name = faker.person.firstName();
		const surname = faker.person.lastName();
		await db.employee.create({
			data: {
				taxCode: fakeCodiceFiscale(),
				name,
				surname,
				birthDate: faker.date.birthdate({ min: 20, max: 60, mode: "age" }),
				street: faker.location.street(),
				houseNumber: faker.location.buildingNumber(),
				city: faker.location.city(),
				province: italianProvince(),
				phoneNumber: italianPhone(),
				email: faker.internet.email({ firstName: name, lastName: surname }),
				hiringDate: faker.date.past({ years: 5 }),
			},
		});
	}

	console.log(`Created ${employeesToCreate} mock employees.`);
}
