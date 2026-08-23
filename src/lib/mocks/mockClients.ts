import { Prisma, PrismaClient } from "@prisma/client";
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
import {
	chunksOf,
	MOCK_SCALE,
	mockScenario,
	randomDateBetween,
} from "./scenario";

function uniqueTaxCode(index: number): string {
	const uniqueSuffix = index.toString(36).toUpperCase().padStart(4, "0");
	return `${fakeCodiceFiscale().slice(0, 12)}${uniqueSuffix}`;
}

function enrollmentDate(): Date {
	const firstDraw = randomDateBetween(
		mockScenario.openedAt,
		mockScenario.now
	);
	return randomDateBetween(firstDraw, mockScenario.now);
}

export async function mockClients(db: PrismaClient) {
	console.log("Mocking clients...");
	const clients: Prisma.ClientCreateManyInput[] = [];

	for (let index = 0; index < MOCK_SCALE.clients; index++) {
		const name = italianFirstName();
		const surname = italianLastName();
		clients.push({
			name,
			surname,
			email: sanitizeItalianText(
				faker.internet.email({ firstName: name, lastName: surname })
			),
			phoneNumber: italianPhone(),
			birthDate: faker.date.birthdate({ min: 18, max: 75, mode: "age" }),
			enrollmentDate: enrollmentDate(),
			taxCode: uniqueTaxCode(index),
			street: italianStreet(),
			houseNumber: faker.location.buildingNumber(),
			city: italianCity(),
			province: italianProvince(),
		});
	}

	for (const batch of chunksOf(clients)) {
		await db.client.createMany({ data: batch });
	}

	console.log(`Created ${clients.length} mock clients.`);
}
