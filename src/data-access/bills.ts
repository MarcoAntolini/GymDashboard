"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { toClient, type ClientOf } from "@/lib/client-payload";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaPage,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import {
	BILL_DEFAULT_SORT,
	BILL_FILTER_ALLOWLIST,
	BILL_SORT_ALLOWLIST,
} from "@/lib/list/bills";
import { Bill, Prisma } from "@prisma/client";

const billInclude = { payment: true } as const;

export type BillRow = ClientOf<Prisma.BillGetPayload<{ include: typeof billInclude }>>;

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

	const description = filters.description;
	if (typeof description === "string") {
		const value = description.trim();
		if (value) where.description = { contains: value };
	}

	return where;
}

function buildBillOrderBy(
	sort: ListSort[]
): Prisma.BillOrderByWithRelationInput[] {
	const orderBy: Prisma.BillOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "provider":
				orderBy.push({ provider: dir });
				break;
			case "paymentDate":
				orderBy.push({ payment: { date: dir } });
				break;
			case "paymentAmount":
				orderBy.push({ payment: { amount: dir } });
				break;
			case "paymentId":
				orderBy.push({ paymentId: dir });
				break;
			default:
				break;
		}
	}
	if (!orderBy.some((o) => "paymentId" in o)) {
		orderBy.push({ paymentId: "asc" });
	}
	return orderBy;
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
	const { skip, take } = toPrismaPage(query);
	const orderByStable = buildBillOrderBy(query.sort);
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
	return toClient(
		await db.bill.findMany({
			include: {
				payment: true,
			},
		})
	);
}

export async function getBill(paymentId: number) {
	return toClient(
		await db.bill.findUnique({
			where: {
				paymentId,
			},
			include: {
				payment: true,
			},
		})
	);
}

export async function editBill(input: Bill): Promise<BillRow> {
	assertMutationPayload("bill", "update", input);
	const { paymentId, description, provider } = input;
	return toClient(
		await db.bill.update({
			where: {
				paymentId,
			},
			data: {
				description,
				provider,
			},
			include: billInclude,
		})
	);
}

export async function deleteBill({ paymentId }: { paymentId: number }) {
	return await db.bill.delete({
		where: {
			paymentId,
		},
	});
}
