import { PrismaClient, Role } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;
const KNOWN_USERNAME = "username";
const KNOWN_PASSWORD = "Password1";

export async function mockAccounts(db: PrismaClient) {
	console.log("Mocking accounts...");
	const employees = await db.employee.findMany();

	if (employees.length === 0) {
		console.log("No employees found; skipping accounts.");
		return;
	}

	const [knownEmployee, ...otherEmployees] = employees;
	const knownPasswordHash = await bcrypt.hash(KNOWN_PASSWORD, SALT_ROUNDS);

	await db.account.create({
		data: {
			username: KNOWN_USERNAME,
			password: knownPasswordHash,
			role: Role.Admin,
			approved: true,
			employeeId: knownEmployee.id,
		},
	});

	for (const employee of otherEmployees) {
		await db.account.create({
			data: {
				username: faker.internet.userName(),
				password: await bcrypt.hash(faker.internet.password(), SALT_ROUNDS),
				role: faker.helpers.arrayElement([Role.Admin, Role.Employee]),
				approved: faker.datatype.boolean(),
				employeeId: employee.id,
			},
		});
	}

	console.log(
		`Created ${employees.length} mock accounts (login: ${KNOWN_USERNAME} / ${KNOWN_PASSWORD}).`
	);
}
