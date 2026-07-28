import { PrismaClient } from "@prisma/client";
import { faker } from "./faker";
import {
	fakeCodiceFiscale,
	italianPhone,
	italianProvince,
} from "./italian";

export async function mockClients(db: PrismaClient) {
	console.log("Mocking clients...");
	const clientsToCreate = 50;

	for (let i = 0; i < clientsToCreate; i++) {
		const name = faker.person.firstName();
		const surname = faker.person.lastName();
		await db.client.create({
			data: {
				name,
				surname,
				email: faker.internet.email({ firstName: name, lastName: surname }),
				phoneNumber: italianPhone(),
				birthDate: faker.date.birthdate({ min: 18, max: 75, mode: "age" }),
				taxCode: fakeCodiceFiscale(),
				street: faker.location.street(),
				houseNumber: faker.location.buildingNumber(),
				city: faker.location.city(),
				province: italianProvince(),
			},
		});
	}

	console.log(`Created ${clientsToCreate} mock clients.`);
}
