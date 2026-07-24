"use server";

import { requireRole } from "@/lib/auth";
import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import {
	PAYMENT_LIST_DEFAULT_SORT,
	PAYMENT_LIST_SORT_COLUMNS,
	buildPaymentListWhere,
	paymentListHasActiveFilters,
} from "@/lib/domain/payment-list-query";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { assertPaymentTypeUnchanged } from "@/lib/domain/payment-edit";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
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
	await requireRole("Employee");
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

export type PaymentListResult = ListQueryResult<PaymentRow> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Pagamenti list (ticket 35): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listPayments(
	input: ListQueryInput
): Promise<PaymentListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildPaymentListWhere(
				params.filters
			) as Prisma.PaymentWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, PAYMENT_LIST_DEFAULT_SORT) ??
				prismaOrderBy(PAYMENT_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = paymentListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.payment.findMany({
					where,
					include: paymentInclude,
					orderBy,
					...skipTake,
				}),
				db.payment.count({ where }),
				needsUnfiltered
					? db.payment.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows: rows.map(withAmountString),
				total,
			};
		},
		{
			allowedSortColumns: PAYMENT_LIST_SORT_COLUMNS,
			defaultSort: PAYMENT_LIST_DEFAULT_SORT,
		}
	);

	return {
		...result,
		totalUnfiltered,
		emptyKind: listEmptyKind({
			totalUnfiltered,
			total: result.total,
			rowCount: result.rows.length,
		}),
	};
}

/** Full table — prefer {@link listPayments} for the Pagamenti page list. */
export async function getAllPayments(): Promise<PaymentRow[]> {
	await requireRole("Employee");
	const payments = await db.payment.findMany({
		include: paymentInclude,
	});
	return payments.map(withAmountString);
}

export async function getPayment(id: number): Promise<PaymentRow | null> {
	await requireRole("Employee");
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
	await requireRole("Employee");
	assertAllowedMutation("pagamenti", "update", input);
	const { id, date, amount, type } = input;
	const existing = await db.payment.findUniqueOrThrow({ where: { id } });
	assertPaymentTypeUnchanged(existing.type, type);
	const amountString = formatCatalogPrice(
		typeof amount === "string" ? amount : String(amount)
	);
	const updated = await db.payment.update({
		where: { id },
		data: {
			date,
			amount: new Prisma.Decimal(amountString),
			// type intentionally unchanged — specialty rows are create-only
			type: existing.type,
		},
		include: paymentInclude,
	});
	return withAmountString(updated);
}

export async function deletePayment({ id }: { id: number }): Promise<PaymentRow> {
	await requireRole("Employee");
	const existing = await db.payment.findUniqueOrThrow({
		where: { id },
		include: paymentInclude,
	});
	await db.payment.delete({ where: { id } });
	return withAmountString(existing);
}
