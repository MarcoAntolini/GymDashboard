"use server";

import { requireRole } from "@/lib/auth";
import {
	SALARY_LIST_DEFAULT_SORT,
	SALARY_LIST_SORT_COLUMNS,
	buildSalaryListWhere,
	salaryListHasActiveFilters,
} from "@/lib/domain/salary-list-query";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	prismaOrderBy,
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Prisma, Salary } from "@prisma/client";

export async function createSalary(input: { paymentId: number; employeeId: number }) {
	await requireRole("Admin");
	assertAllowedMutation("stipendi", "create", input);
	const { paymentId, employeeId } = input;
	return await db.salary.create({
		data: {
			paymentId,
			employeeId,
		},
	});
}

export type SalaryListResult = ListQueryResult<Salary> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Stipendi list (ticket 31): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listSalaries(
	input: ListQueryInput
): Promise<SalaryListResult> {
	await requireRole("Admin");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildSalaryListWhere(
				params.filters
			) as Prisma.SalaryWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, SALARY_LIST_DEFAULT_SORT) ??
				prismaOrderBy(SALARY_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = salaryListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.salary.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.salary.count({ where }),
				needsUnfiltered
					? db.salary.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return {
				rows,
				total,
			};
		},
		{
			allowedSortColumns: SALARY_LIST_SORT_COLUMNS,
			defaultSort: SALARY_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listSalaries} for the Stipendi page list. */
export async function getAllSalaries() {
	await requireRole("Admin");
	return await db.salary.findMany({
		include: {
			payment: true,
			employee: true,
		},
	});
}

export async function getSalary(paymentId: number) {
	await requireRole("Admin");
	return await db.salary.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
			employee: true,
		},
	});
}

export async function editSalary(input: Salary) {
	await requireRole("Admin");
	assertAllowedMutation("stipendi", "update", input);
	const { paymentId, employeeId } = input;
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
