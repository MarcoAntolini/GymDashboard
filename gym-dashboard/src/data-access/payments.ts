"use server";

import { db } from "@/lib/db";
import { Payment, PaymentType } from "@prisma/client";

type PaymentData = {
	date: Date;
	amount: number;
	type: PaymentType;
} & (
	| { type: "Salary"; employeeId: number }
	| { type: "Bill"; description: string; provider: string }
	| { type: "Equipment"; description: string; provider: string }
	| {
			type: "Intervention";
			description: string;
			maker: string;
			startingTime: Date;
			endingTime: Date;
	  }
);

export async function createPayment(data: PaymentData) {
	const { date, amount, type, ...specificData } = data;
	const payment = await db.payment.create({
		data: {
			date,
			amount,
			type
		}
	});
	switch (type) {
		case "Salary":
			await db.salary.create({
				data: {
					paymentId: payment.id,
					employeeId: (specificData as { employeeId: number }).employeeId
				}
			});
			break;
		case "Bill":
			await db.bill.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					provider: (specificData as { provider: string }).provider
				}
			});
			break;
		case "Equipment":
			await db.equipment.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					provider: (specificData as { provider: string }).provider
				}
			});
			break;
		case "Intervention":
			await db.intervention.create({
				data: {
					paymentId: payment.id,
					description: (specificData as { description: string }).description,
					maker: (specificData as { maker: string }).maker,
					startingTime: (specificData as { startingTime: Date }).startingTime,
					endingTime: (specificData as { endingTime: Date }).endingTime
				}
			});
			break;
	}

	return payment;
}

export async function getAllPayments() {
	return await db.payment.findMany({
		include: {
			intervention: true,
			equipment: true,
			bill: true,
			salary: true
		}
	});
}

export async function getPayment(id: number) {
	return await db.payment.findUnique({
		where: {
			id
		},
		include: {
			intervention: true,
			equipment: true,
			bill: true,
			salary: true
		}
	});
}

export async function editPayment({ id, date, amount, type }: Payment) {
	return await db.payment.update({
		where: {
			id
		},
		data: {
			date,
			amount,
			type
		},
		include: {
			intervention: true,
			equipment: true,
			bill: true,
			salary: true
		}
	});
}

export async function deletePayment({ id }: { id: number }) {
	return await db.payment.delete({
		where: {
			id
		}
	});
}
