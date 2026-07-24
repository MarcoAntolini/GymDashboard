"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { Bill } from "@prisma/client";

export async function createBill(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	assertMutationPayload("bill", "create", input);
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
	return await db.bill.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getBill(paymentId: number) {
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
	assertMutationPayload("bill", "update", input);
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
	return await db.bill.delete({
		where: {
			paymentId,
		},
	});
}
