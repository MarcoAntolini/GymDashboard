import { PrismaClient } from "@prisma/client";
import { startOfDay } from "date-fns";
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
	MOCK_SCALE,
	chunksOf,
	mockScenario,
	randomDateBetween,
} from "./scenario";

export async function mockEmployees(db: PrismaClient) {
	console.log("Mocking employees...");
	const currentEmployees = Math.round(MOCK_SCALE.employees * 0.83);
	const taxCodes = new Set<string>();
	const rows = Array.from({ length: MOCK_SCALE.employees }, (_, index) => {
		const name = italianFirstName();
		const surname = italianLastName();
		const birthDate = faker.date.birthdate({ min: 24, max: 58, mode: "age" });
		const latestHiringDate = new Date(mockScenario.today);
		latestHiringDate.setDate(
			latestHiringDate.getDate() - (index < currentEmployees ? 45 : 365)
		);

		let taxCode = fakeCodiceFiscale();
		while (taxCodes.has(taxCode)) taxCode = fakeCodiceFiscale();
		taxCodes.add(taxCode);

		return {
			taxCode,
			name,
			surname,
			birthDate,
			street: italianStreet(),
			houseNumber: faker.location.buildingNumber(),
			city: italianCity(),
			province: italianProvince(),
			phoneNumber: italianPhone(),
			email: sanitizeItalianText(
				faker.internet.email({ firstName: name, lastName: surname })
			),
			hiringDate: startOfDay(
				randomDateBetween(mockScenario.openedAt, latestHiringDate)
			),
		};
	});

	for (const batch of chunksOf(rows)) {
		await db.employee.createMany({ data: batch });
	}

	console.log(
		`Created ${rows.length} mock employees (${currentEmployees} intended active, ${rows.length - currentEmployees} former).`
	);
}
