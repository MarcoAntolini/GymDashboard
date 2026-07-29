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

export async function mockClients(db: PrismaClient) {
	console.log("Mocking clients...");
	const clientsToCreate = 50;

	for (let i = 0; i < clientsToCreate; i++) {
		const name = italianFirstName();
		const surname = italianLastName();
		await db.client.create({
			data: {
				name,
				surname,
				email: sanitizeItalianText(
					faker.internet.email({ firstName: name, lastName: surname })
				),
				phoneNumber: italianPhone(),
				birthDate: faker.date.birthdate({ min: 18, max: 75, mode: "age" }),
				taxCode: fakeCodiceFiscale(),
				street: italianStreet(),
				houseNumber: faker.location.buildingNumber(),
				city: italianCity(),
				province: italianProvince(),
			},
		});
	}

	console.log(`Created ${clientsToCreate} mock clients.`);
}
