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
import { Intervention, Prisma } from "@prisma/client";

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const interventionFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.InterventionWhereInput | undefined>
> = {
	paymentId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { paymentId: id } : undefined;
	},
	maker: (filter) => {
		const value = textContains(filter);
		return value ? { maker: { contains: value } } : undefined;
	},
	description: (filter) => {
		const value = textContains(filter);
		return value ? { description: { contains: value } } : undefined;
	},
};

const interventionSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.InterventionOrderByWithRelationInput>
> = {
	paymentId: (desc) => ({ paymentId: desc ? "desc" : "asc" }),
	maker: (desc) => ({ maker: desc ? "desc" : "asc" }),
	description: (desc) => ({ description: desc ? "desc" : "asc" }),
	startingTime: (desc) => ({ startingTime: desc ? "desc" : "asc" }),
	endingTime: (desc) => ({ endingTime: desc ? "desc" : "asc" }),
};

export async function createIntervention({
	paymentId,
	description,
	maker,
	startingTime,
	endingTime,
}: {
	paymentId: number;
	description: string;
	maker: string;
	startingTime: Date;
	endingTime: Date;
}) {
	await requireRole("Employee");
	return await db.intervention.create({
		data: {
			paymentId,
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function listInterventions(
	rawQuery: ListQuery
): Promise<ListResult<Intervention>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, interventionFilterMap);
	const orderBy = resolveOrderBy(query.sort, interventionSortMap, { startingTime: "desc" });

	const [total, items] = await Promise.all([
		db.intervention.count({ where }),
		db.intervention.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
	]);

	return { items, total };
}

export async function getIntervention(paymentId: number) {
	await requireRole("Employee");
	return await db.intervention.findUnique({
		where: {
			paymentId,
		},
	});
}

export async function editIntervention({
	paymentId,
	description,
	maker,
	startingTime,
	endingTime,
}: Intervention) {
	await requireRole("Employee");
	return await db.intervention.update({
		where: {
			paymentId,
		},
		data: {
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function deleteIntervention({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.intervention.delete({
		where: {
			paymentId,
		},
	});
}
