"use server";

import { requireRole, requireRoleUnlessPublic } from "@/lib/auth";
import {
	EMPLOYEE_LIST_DEFAULT_SORT,
	EMPLOYEE_LIST_SORT_COLUMNS,
	buildEmployeeListWhere,
	employeeListHasActiveFilters,
} from "@/lib/domain/employee-list-query";
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
import type { Employee, Prisma } from "@prisma/client";

export type EmployeeListResult = ListQueryResult<Employee> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

export async function createEmployee(input: {
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber?: string;
	email?: string;
	hiringDate?: Date;
}) {
	await requireRole("Admin");
	assertAllowedMutation("dipendenti", "create", input);
	const {
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;
	return await db.employee.create({
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber: phoneNumber || "",
			email: email || "",
			hiringDate: hiringDate || new Date(),
		},
	});
}

/**
 * Server-side Dipendenti list (ticket 27): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listEmployees(
	input: ListQueryInput
): Promise<EmployeeListResult> {
	await requireRole("Admin");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildEmployeeListWhere(
				params.filters
			) as Prisma.EmployeeWhereInput;
			const orderBy =
				prismaOrderBy(params.sort, EMPLOYEE_LIST_DEFAULT_SORT) ??
				prismaOrderBy(EMPLOYEE_LIST_DEFAULT_SORT);
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = employeeListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.employee.findMany({
					where,
					orderBy,
					...skipTake,
				}),
				db.employee.count({ where }),
				needsUnfiltered
					? db.employee.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows, total };
		},
		{
			allowedSortColumns: EMPLOYEE_LIST_SORT_COLUMNS,
			defaultSort: EMPLOYEE_LIST_DEFAULT_SORT,
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

/** Full table — prefer {@link listEmployees} for the Dipendenti page list. */
export async function getAllEmployees() {
	await requireRole("Admin");
	return await db.employee.findMany();
}

/** Public register lookup; authenticated callers need Employee+ (Admin inherits). */
export async function getEmployee(id: number) {
	await requireRoleUnlessPublic("Employee");
	return await db.employee.findUnique({
		where: {
			id,
		},
	});
}

export async function editEmployee(input: {
	id: number;
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	hiringDate: Date;
}) {
	await requireRole("Admin");
	assertAllowedMutation("dipendenti", "update", input);
	const {
		id,
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;
	return await db.employee.update({
		where: {
			id,
		},
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			hiringDate,
		},
	});
}

export async function deleteEmployee({ id }: { id: number }) {
	await requireRole("Admin");
	return await db.employee.delete({
		where: {
			id,
		},
	});
}

export async function getEmployeesWithoutAccount() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			account: {
				is: null,
			},
		},
	});
}

export async function getEmployeesWithoutContract() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			contracts: {
				none: {},
			},
		},
	});
}
