import { Prisma, PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { faker } from "./faker";
import { MOCK_ROLE } from "./prisma-enums";
import { chunksOf } from "./scenario";

const SALT_ROUNDS = 10;
const OWNER_USERNAME = "owner";
const OWNER_PASSWORD = "Password1";

export async function mockAccounts(db: PrismaClient) {
	console.log("Mocking accounts...");
	const employees = await db.employee.findMany({
		where: { contracts: { some: { endingDate: null } } },
		orderBy: { id: "asc" },
	});

	if (employees.length === 0) {
		console.log("No active employees found; skipping accounts.");
		return;
	}

	const [ownerEmployee, ...otherEmployees] = employees;
	const usernames = new Set([OWNER_USERNAME]);
	const unapprovedEmployeeIds = new Set(
		faker.helpers
			.shuffle(otherEmployees.map((employee) => employee.id))
			.slice(0, Math.min(2, otherEmployees.length))
	);

	const credentials = [
		{
			employee: ownerEmployee,
			username: OWNER_USERNAME,
			plainPassword: OWNER_PASSWORD,
			role: MOCK_ROLE.Owner,
			approved: true,
		},
		...otherEmployees.map((employee) => {
			const base =
				`${employee.name}.${employee.surname}`
					.normalize("NFD")
					.replace(/[\u0300-\u036f]/g, "")
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, ".")
					.replace(/^\.+|\.+$/g, "")
					.slice(0, 24) || `dipendente${employee.id}`;
			let username = base;
			let suffix = 2;
			while (usernames.has(username)) {
				username = `${base.slice(0, 20)}${suffix}`;
				suffix++;
			}
			usernames.add(username);
			return {
				employee,
				username,
				plainPassword: faker.internet.password({ length: 14 }),
				role:
					faker.number.int({ min: 1, max: 100 }) <= 15
						? MOCK_ROLE.Admin
						: MOCK_ROLE.Employee,
				approved: !unapprovedEmployeeIds.has(employee.id),
			};
		}),
	];
	const rows: Prisma.AccountCreateManyInput[] = await Promise.all(
		credentials.map(async ({ employee, plainPassword, ...account }) => ({
			...account,
			password: await bcrypt.hash(plainPassword, SALT_ROUNDS),
			employeeId: employee.id,
		}))
	);

	for (const batch of chunksOf(rows)) {
		// Prisma 7 does not currently translate mapped enum values in createMany.
		await db.$transaction(
			batch.map((data) => db.account.create({ data }))
		);
	}

	console.log(
		`Created ${rows.length} mock accounts for active personnel (${unapprovedEmployeeIds.size} awaiting approval; login Owner: ${OWNER_USERNAME} / ${OWNER_PASSWORD}).`
	);
}
