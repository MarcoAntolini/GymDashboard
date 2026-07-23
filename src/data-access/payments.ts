"use server";

import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { PaymentType, Prisma } from "@prisma/client";

const paymentInclude = {
	intervention: true,
	equipment: true,
	bill: true,
	salary: true,
} satisfies Prisma.PaymentInclude;

type PaymentWithRelations = Prisma.PaymentGetPayload<{ include: typeof paymentInclude }>;

export type PaymentRow = Omit<PaymentWithRelations, "amount"> & {
	/** Always a 2-decimal string for forms/display (Decimal end-to-end via Prisma write). */
	amount: string;
};

type PaymentData = {
	date: Date;
	amount: string | number | Prisma.Decimal;
} & (
	| { type: typeof PaymentType.Salary; employeeId: number }
	| { type: typeof PaymentType.Bill; description: string; provider: string }
	| { type: typeof PaymentType.Equipment; description: string; provider: string }
	| {
			type: typeof PaymentType.Intervention;
			description: string;
			maker: string;
			startingTime: Date;
			endingTime: Date;
	  }
);

function withAmountString<
	T extends { amount: string | number | { toFixed: (digits: number) => string } },
>(payment: T): Omit<T, "amount"> & { amount: string } {
	return {
		...payment,
		amount: formatCatalogPrice(payment.amount),
	};
}

export async function createPayment(data: PaymentData): Promise<PaymentRow> {
	assertAllowedMutation("pagamenti", "create", data);
	const amountString = formatCatalogPrice(
		typeof data.amount === "string" ? data.amount : String(data.amount)
	);
	const payment = await db.payment.create({
		data: {
			date: data.date,
			amount: new Prisma.Decimal(amountString),
			type: data.type,
		},
	});
	switch (data.type) {
		case PaymentType.Salary:
			await db.salary.create({
				data: {
					paymentId: payment.id,
					employeeId: data.employeeId,
				},
			});
			break;
		case PaymentType.Bill:
			await db.bill.create({
				data: {
					paymentId: payment.id,
					description: data.description,
					provider: data.provider,
				},
			});
			break;
		case PaymentType.Equipment:
			await db.equipment.create({
				data: {
					paymentId: payment.id,
					description: data.description,
					provider: data.provider,
				},
			});
			break;
		case PaymentType.Intervention:
			await db.intervention.create({
				data: {
					paymentId: payment.id,
					description: data.description,
					maker: data.maker,
					startingTime: data.startingTime,
					endingTime: data.endingTime,
				},
			});
			break;
	}

	const full = await db.payment.findUniqueOrThrow({
		where: { id: payment.id },
		include: paymentInclude,
	});
	return withAmountString(full);
}

export async function getAllPayments(): Promise<PaymentRow[]> {
	const payments = await db.payment.findMany({
		include: paymentInclude,
	});
	return payments.map(withAmountString);
}

export async function getPayment(id: number): Promise<PaymentRow | null> {
	const payment = await db.payment.findUnique({
		where: { id },
		include: paymentInclude,
	});
	return payment ? withAmountString(payment) : null;
}

export async function editPayment(input: {
	id: number;
	date: Date;
	amount: string | number | Prisma.Decimal;
	type: PaymentType;
}): Promise<PaymentRow> {
	assertAllowedMutation("pagamenti", "update", input);
	const { id, date, amount, type } = input;
	const amountString = formatCatalogPrice(
		typeof amount === "string" ? amount : String(amount)
	);
	const updated = await db.payment.update({
		where: { id },
		data: {
			date,
			amount: new Prisma.Decimal(amountString),
			type,
		},
		include: paymentInclude,
	});
	return withAmountString(updated);
}

export async function deletePayment({ id }: { id: number }): Promise<PaymentRow> {
	const existing = await db.payment.findUniqueOrThrow({
		where: { id },
		include: paymentInclude,
	});
	await db.payment.delete({ where: { id } });
	return withAmountString(existing);
}
