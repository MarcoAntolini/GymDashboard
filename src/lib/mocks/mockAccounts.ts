import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "./faker";

const SALT_ROUNDS = 10;
const OWNER_USERNAME = "owner";
const OWNER_PASSWORD = "Password1";

export async function mockAccounts(db: PrismaClient) {
	console.log("Mocking accounts...");
	const employees = await db.employee.findMany();

	if (employees.length === 0) {
		console.log("No employees found; skipping accounts.");
		return;
	}

	const [ownerEmployee, ...otherEmployees] = employees;
	const ownerPasswordHash = await bcrypt.hash(OWNER_PASSWORD, SALT_ROUNDS);

	await db.account.create({
		data: {
			username: OWNER_USERNAME,
			password: ownerPasswordHash,
			role: Role.Owner,
			approved: true,
			employeeId: ownerEmployee.id,
		},
	});

	for (const employee of otherEmployees) {
		const role = faker.helpers.arrayElement([Role.Admin, Role.Employee]);
		const usernameBase = faker.internet
			.userName()
			.toLowerCase()
			.replace(/[^a-z0-9._]/g, "")
			.slice(0, 20);
		await db.account.create({
			data: {
				username: `${usernameBase}${faker.number.int({ min: 10, max: 99 })}`,
				password: await bcrypt.hash(faker.internet.password(), SALT_ROUNDS),
				role,
				approved: role === Role.Admin ? true : faker.datatype.boolean(),
				employeeId: employee.id,
			},
		});
	}

	console.log(
		`Created ${employees.length} mock accounts (login Owner: ${OWNER_USERNAME} / ${OWNER_PASSWORD}).`
	);
}
