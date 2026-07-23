"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Bill } from "@prisma/client";

export async function createBill(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	assertAllowedMutation("bollette", "create", input);
	const { paymentId, description, provider } = input;
	return await db.bill.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function getAllBills() {
	await requireRole("Employee");
	return await db.bill.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getBill(paymentId: number) {
	await requireRole("Employee");
	return await db.bill.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editBill(input: Bill) {
	await requireRole("Employee");
	assertAllowedMutation("bollette", "update", input);
	const { paymentId, description, provider } = input;
	return await db.bill.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteBill({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.bill.delete({
		where: {
			paymentId,
		},
	});
}
