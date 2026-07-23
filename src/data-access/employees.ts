"use server";

import { requireRole, requireRoleUnlessPublic } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";

export async function createEmployee(input: {
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber?: string;
	email?: string;
	hiringDate?: Date;
}) {
	await requireRole("Admin");
	assertAllowedMutation("dipendenti", "create", input);
	const {
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;
	return await db.employee.create({
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber: phoneNumber || "",
			email: email || "",
			hiringDate: hiringDate || new Date(),
		},
	});
}

export async function getAllEmployees() {
	await requireRole("Admin");
	return await db.employee.findMany();
}

/** Public register lookup; authenticated callers need Employee+ (Admin inherits). */
export async function getEmployee(id: number) {
	await requireRoleUnlessPublic("Employee");
	return await db.employee.findUnique({
		where: {
			id,
		},
	});
}

export async function editEmployee(input: {
	id: number;
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	hiringDate: Date;
}) {
	await requireRole("Admin");
	assertAllowedMutation("dipendenti", "update", input);
	const {
		id,
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;
	return await db.employee.update({
		where: {
			id,
		},
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			hiringDate,
		},
	});
}

export async function deleteEmployee({ id }: { id: number }) {
	await requireRole("Admin");
	return await db.employee.delete({
		where: {
			id,
		},
	});
}

export async function getEmployeesWithoutAccount() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			account: {
				is: null,
			},
		},
	});
}

export async function getEmployeesWithoutContract() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			contracts: {
				none: {},
			},
		},
	});
}
