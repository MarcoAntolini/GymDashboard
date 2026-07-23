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
import { Prisma, Salary } from "@prisma/client";

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const salaryFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.SalaryWhereInput | undefined>
> = {
	paymentId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { paymentId: id } : undefined;
	},
	employeeId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { employeeId: id } : undefined;
	},
};

const salarySortMap: Partial<
	Record<string, (desc: boolean) => Prisma.SalaryOrderByWithRelationInput>
> = {
	paymentId: (desc) => ({ paymentId: desc ? "desc" : "asc" }),
	employeeId: (desc) => ({ employeeId: desc ? "desc" : "asc" }),
};

export async function createSalary({
	paymentId,
	employeeId,
}: {
	paymentId: number;
	employeeId: number;
}) {
	await requireRole("Admin");
	return await db.salary.create({
		data: {
			paymentId,
			employeeId,
		},
	});
}

export async function listSalaries(rawQuery: ListQuery): Promise<ListResult<Salary>> {
	await requireRole("Admin");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, salaryFilterMap);
	const orderBy = resolveOrderBy(query.sort, salarySortMap, { paymentId: "desc" });

	const [total, items] = await Promise.all([
		db.salary.count({ where }),
		db.salary.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
	]);

	return { items, total };
}

export async function getSalary(paymentId: number) {
	await requireRole("Admin");
	return await db.salary.findUnique({
		where: {
			paymentId,
		},
	});
}

export async function editSalary({ paymentId, employeeId }: Salary) {
	await requireRole("Admin");
	return await db.salary.update({
		where: {
			paymentId,
		},
		data: {
			employeeId,
		},
	});
}

export async function deleteSalary({ paymentId }: { paymentId: number }) {
	await requireRole("Admin");
	return await db.salary.delete({
		where: {
			paymentId,
		},
	});
}
