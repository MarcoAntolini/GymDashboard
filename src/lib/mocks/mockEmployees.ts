import { PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	fakeCodiceFiscale,
	italianCity,
	italianFirstName,
	italianLastName,
	italianPhone,
	italianProvince,
	italianStreet,
	sanitizeItalianText,
} from "./italian";

export async function mockEmployees(db: PrismaClient) {
	console.log("Mocking employees...");
	const employeesToCreate = 20;

	for (let i = 0; i < employeesToCreate; i++) {
		const name = italianFirstName();
		const surname = italianLastName();
		await db.employee.create({
			data: {
				taxCode: fakeCodiceFiscale(),
				name,
				surname,
				birthDate: faker.date.birthdate({ min: 20, max: 60, mode: "age" }),
				street: italianStreet(),
				houseNumber: faker.location.buildingNumber(),
				city: italianCity(),
				province: italianProvince(),
				phoneNumber: italianPhone(),
				email: sanitizeItalianText(
					faker.internet.email({ firstName: name, lastName: surname })
				),
				hiringDate: faker.date.past({ years: 5 }),
			},
		});
	}

	console.log(`Created ${employeesToCreate} mock employees.`);
}
