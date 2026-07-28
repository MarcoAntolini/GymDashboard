"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { requireRole } from "@/lib/auth";
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
	SALARY_DEFAULT_SORT,
	SALARY_FILTER_ALLOWLIST,
	SALARY_SORT_ALLOWLIST,
} from "@/lib/list/salaries";
import { Prisma, Salary } from "@prisma/client";

const salaryInclude = {
	payment: true,
	employee: true,
} as const;

export type SalaryRow = Prisma.SalaryGetPayload<{ include: typeof salaryInclude }>;

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

function buildSalaryWhere(filters: ListFilters): Prisma.SalaryWhereInput {
	const where: Prisma.SalaryWhereInput = {};

	const paymentId = parsePositiveIntFilter(filters.paymentId);
	if (paymentId !== undefined) where.paymentId = paymentId;

	const employeeId = parsePositiveIntFilter(filters.employeeId);
	if (employeeId !== undefined) where.employeeId = employeeId;

	const employee = filters.employee;
	if (typeof employee === "string") {
		const value = employee.trim();
		if (value) {
			where.employee = {
				OR: [
					{ surname: { contains: value } },
					{ name: { contains: value } },
				],
			};
		}
	}

	return where;
}

/**
 * Lista Stipendi server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listSalaries(
	input: ListQueryInput = {}
): Promise<ListResult<SalaryRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: SALARY_SORT_ALLOWLIST,
		filterAllowlist: SALARY_FILTER_ALLOWLIST,
		defaultSort: [...SALARY_DEFAULT_SORT],
	});
	const where = buildSalaryWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "paymentId" in o)
			? []
			: [{ paymentId: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.salary.count({ where }),
		db.salary.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: salaryInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createSalary(input: { paymentId: number; employeeId: number }) {
	await requireRole("Admin");
	assertMutationPayload("salary", "create", input);
	const { paymentId, employeeId } = input;
	return await db.salary.create({
		data: {
			paymentId,
			employeeId,
		},
	});
}

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

export async function editSalary(input: Salary): Promise<SalaryRow> {
	await requireRole("Admin");
	assertMutationPayload("salary", "update", input);
	const { paymentId, employeeId } = input;
	return await db.salary.update({
		where: {
			paymentId,
		},
		data: {
			employeeId,
		},
		include: salaryInclude,
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
