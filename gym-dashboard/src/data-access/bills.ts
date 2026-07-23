"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	buildWhere,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Bill, Prisma } from "@prisma/client";

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const billFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.BillWhereInput | undefined>
> = {
	paymentId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { paymentId: id } : undefined;
	},
	provider: (filter) => {
		const value = textContains(filter);
		return value ? { provider: { contains: value } } : undefined;
	},
	description: (filter) => {
		const value = textContains(filter);
		return value ? { description: { contains: value } } : undefined;
	},
};

const billSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.BillOrderByWithRelationInput>
> = {
	paymentId: (desc) => ({ paymentId: desc ? "desc" : "asc" }),
	provider: (desc) => ({ provider: desc ? "desc" : "asc" }),
	description: (desc) => ({ description: desc ? "desc" : "asc" }),
};

export async function createBill({
	paymentId,
	description,
	provider,
}: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	return await db.bill.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function listBills(rawQuery: ListQuery): Promise<ListResult<Bill>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, billFilterMap);
	const orderBy = resolveOrderBy(query.sort, billSortMap, { paymentId: "desc" });

	const [total, items] = await Promise.all([
		db.bill.count({ where }),
		db.bill.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
	]);

	return { items, total };
}

export async function getBill(paymentId: number) {
	await requireRole("Employee");
	return await db.bill.findUnique({
		where: {
			paymentId,
		},
	});
}

export async function editBill({ paymentId, description, provider }: Bill) {
	await requireRole("Employee");
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
