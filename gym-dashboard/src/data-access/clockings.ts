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
import { Clocking, Prisma } from "@prisma/client";

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const clockingFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.ClockingWhereInput | undefined>
> = {
	employeeId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { employeeId: id } : undefined;
	},
};

const clockingSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.ClockingOrderByWithRelationInput>
> = {
	employeeId: (desc) => ({ employeeId: desc ? "desc" : "asc" }),
	entranceTime: (desc) => ({ entranceTime: desc ? "desc" : "asc" }),
	exitTime: (desc) => ({ exitTime: desc ? "desc" : "asc" }),
};

export async function createClocking({
	employeeId,
	entranceTime,
	exitTime,
}: {
	employeeId: number;
	entranceTime: Date;
	exitTime?: Date;
}) {
	await requireRole("Admin");
	return await db.clocking.create({
		data: {
			employeeId,
			entranceTime,
			exitTime,
		},
	});
}

export async function listClockings(rawQuery: ListQuery): Promise<ListResult<Clocking>> {
	await requireRole("Admin");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, clockingFilterMap);
	const orderBy = resolveOrderBy(query.sort, clockingSortMap, { entranceTime: "desc" });

	const [total, items] = await Promise.all([
		db.clocking.count({ where }),
		db.clocking.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
	]);

	return { items, total };
}

export async function getClocking(employeeId: number, entranceTime: Date) {
	await requireRole("Admin");
	return await db.clocking.findUnique({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}

export async function editClocking({ employeeId, entranceTime, exitTime }: Clocking) {
	await requireRole("Admin");
	return await db.clocking.update({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
		data: {
			exitTime,
		},
	});
}

export async function deleteClocking({
	employeeId,
	entranceTime,
}: {
	employeeId: number;
	entranceTime: Date;
}) {
	await requireRole("Admin");
	return await db.clocking.delete({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}
