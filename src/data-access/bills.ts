"use server";

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
	BILL_DEFAULT_SORT,
	BILL_FILTER_ALLOWLIST,
	BILL_SORT_ALLOWLIST,
} from "@/lib/list/bills";
import { Bill, Prisma } from "@prisma/client";

const billInclude = { payment: true } as const;

export type BillRow = Prisma.BillGetPayload<{ include: typeof billInclude }>;

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

function buildBillWhere(filters: ListFilters): Prisma.BillWhereInput {
	const where: Prisma.BillWhereInput = {};

	const paymentId = parsePositiveIntFilter(filters.paymentId);
	if (paymentId !== undefined) where.paymentId = paymentId;

	const provider = filters.provider;
	if (typeof provider === "string") {
		const value = provider.trim();
		if (value) where.provider = { contains: value };
	}

	return where;
}

/**
 * Lista Bollette server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listBills(
	input: ListQueryInput = {}
): Promise<ListResult<BillRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: BILL_SORT_ALLOWLIST,
		filterAllowlist: BILL_FILTER_ALLOWLIST,
		defaultSort: [...BILL_DEFAULT_SORT],
	});
	const where = buildBillWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "paymentId" in o)
			? []
			: [{ paymentId: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.bill.count({ where }),
		db.bill.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: billInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

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

export async function editBill(input: Bill): Promise<BillRow> {
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
		include: billInclude,
	});
}

export async function deleteBill({ paymentId }: { paymentId: number }) {
	return await db.bill.delete({
		where: {
			paymentId,
		},
	});
}
