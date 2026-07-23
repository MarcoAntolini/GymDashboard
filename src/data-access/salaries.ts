"use server";

import { db } from "@/lib/db";
import { Salary } from "@prisma/client";

export async function createSalary({ paymentId, employeeId }: { paymentId: number; employeeId: number }) {
	return await db.salary.create({
		data: {
			paymentId,
			employeeId,
		},
	});
}

export async function getAllSalaries() {
	return await db.salary.findMany({
		include: {
			payment: true,
			employee: true,
		},
	});
}

export async function getSalary(paymentId: number) {
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

export async function editSalary({ paymentId, employeeId }: Salary) {
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
	return await db.salary.delete({
		where: {
			paymentId,
		},
	});
}
