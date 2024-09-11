"use server";

import { db } from "@/lib/db";
import { Bill } from "@prisma/client";

export async function createBill({
	paymentId,
	description,
	provider,
}: {
	paymentId: number;
	description: string;
	provider: string;
}) {
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

export async function editBill({ paymentId, description, provider }: Bill) {
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
