"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Salary } from "@prisma/client";

export async function createSalary(input: { paymentId: number; employeeId: number }) {
	await requireRole("Admin");
	assertAllowedMutation("stipendi", "create", input);
	const { paymentId, employeeId } = input;
	return await db.salary.create({
		data: {
			paymentId,
			employeeId,
		},
	});
}

export async function getAllSalaries() {
	await requireRole("Admin");
	return await db.salary.findMany({
		include: {
			payment: true,
			employee: true,
		},
	});
}

export async function getSalary(paymentId: number) {
	await requireRole("Admin");
	return await db.salary.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
			employee: true,
		},
	});
}

export async function editSalary(input: Salary) {
	await requireRole("Admin");
	assertAllowedMutation("stipendi", "update", input);
	const { paymentId, employeeId } = input;
	return await db.salary.update({
		where: {
			paymentId,
		},
		data: {
			employeeId,
		},
	});
}

export async function deleteSalary({ paymentId }: { paymentId: number }) {
	await requireRole("Admin");
	return await db.salary.delete({
		where: {
			paymentId,
		},
	});
}
