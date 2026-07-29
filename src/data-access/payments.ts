"use server";

import { requireRole } from "@/lib/auth";
import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
} from "@/lib/list";
import {
	PAYMENT_DEFAULT_SORT,
	PAYMENT_FILTER_ALLOWLIST,
	PAYMENT_SORT_ALLOWLIST,
} from "@/lib/list/payments";
import {
	aggregateByPeriod,
	normalizeInclusiveRange,
	periodKeyForDate,
	type PeriodPoint,
	type PeriodType,
} from "@/lib/period-aggregation";
import { Payment, PaymentType, Prisma } from "@prisma/client";

type MoneyInput = Prisma.Decimal | number | string;

type PaymentData = {
	date: Date;
	amount: MoneyInput;
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

const PAYMENT_TYPES = new Set<string>(Object.values(PaymentType));

const paymentListInclude = {
	salary: true,
	bill: true,
	equipment: true,
	intervention: true,
} as const;

export type PaymentRow = Prisma.PaymentGetPayload<{
	include: typeof paymentListInclude;
}>;

function parsePositiveIntFilter(raw: ListFilters[string]): number | undefined {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const n = Math.trunc(raw);
		return n > 0 ? n : undefined;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!/^\d+$/.test(trimmed)) return undefined;
		const n = Number.parseInt(trimmed, 10);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	}
	return undefined;
}

function parsePaymentTypeFilter(raw: ListFilters[string]): PaymentType | undefined {
	if (typeof raw !== "string") return undefined;
	const value = raw.trim();
	if (!value || !PAYMENT_TYPES.has(value)) return undefined;
	return value as PaymentType;
}

function buildPaymentWhere(filters: ListFilters): Prisma.PaymentWhereInput {
	const where: Prisma.PaymentWhereInput = {};

	const id = parsePositiveIntFilter(filters.id);
	if (id !== undefined) where.id = id;

	const type = parsePaymentTypeFilter(filters.type);
	if (type !== undefined) where.type = type;

	return where;
}

/**
 * Lista Pagamenti server-side: filtri su Conferma, sort + paginazione via DB.
 * Include le specializzazioni così la UI può ispezionare i campi tipizzati.
 */
export async function listPayments(
	input: ListQueryInput = {}
): Promise<ListResult<PaymentRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: PAYMENT_SORT_ALLOWLIST,
		filterAllowlist: PAYMENT_FILTER_ALLOWLIST,
		defaultSort: [...PAYMENT_DEFAULT_SORT],
	});
	const where = buildPaymentWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "id" in o) ? [] : [{ id: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.payment.count({ where }),
		db.payment.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: paymentListInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createPayment(data: PaymentData) {
	assertMutationPayload("payment", "create", data);
	const { date, amount, type, ...specificData } = data;
	const payment = await db.payment.create({
		data: {
			date,
			amount: new Prisma.Decimal(amount),
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

export async function editPayment(input: Omit<Payment, "amount"> & { amount: MoneyInput }) {
	assertMutationPayload("payment", "update", input);
	const { id, date, amount, type } = input;
	const existing = await db.payment.findUnique({ where: { id } });
	if (!existing) {
		throw new Error("Pagamento non trovato.");
	}
	if (type !== existing.type) {
		throw new Error(
			"Il tipo del Pagamento non è modificabile: crea un nuovo Pagamento per la specializzazione desiderata."
		);
	}
	return await db.payment.update({
		where: {
			id
		},
		data: {
			date,
			amount: new Prisma.Decimal(amount),
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

export type UscitePeriodPoint = PeriodPoint & {
	totalAmount: number;
	count: number;
};

/**
 * Uscite (Pagamenti) aggregate per granularità di periodo:
 * giornaliero / settimanale / mensile / annuale.
 */
export async function getUsciteByPeriod(
	startDate: Date,
	endDate: Date,
	periodType: PeriodType
): Promise<UscitePeriodPoint[]> {
	await requireRole("Employee");
	const { from, to } = normalizeInclusiveRange(startDate, endDate);
	const rows = await db.payment.findMany({
		where: {
			date: {
				gte: from,
				lte: to,
			},
		},
		select: { date: true, amount: true },
	});

	const amountSeries = aggregateByPeriod(
		rows,
		(row) => row.date,
		from,
		to,
		periodType,
		(row) => Number(row.amount)
	);
	const countByKey = new Map<string, number>();
	for (const row of rows) {
		const key = periodKeyForDate(row.date, periodType);
		countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
	}

	return amountSeries.map((point) => ({
		...point,
		totalAmount: point.value,
		count: countByKey.get(point.key) ?? 0,
	}));
}
