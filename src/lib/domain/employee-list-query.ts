/**
 * Dipendenti list-query helpers (ticket 27).
 *
 * Pure WHERE / sort contract for server-side Dipendenti lists — used by
 * `listEmployees` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const EMPLOYEE_LIST_SORT_COLUMNS = [
	"id",
	"taxCode",
	"name",
	"surname",
	"birthDate",
	"city",
	"province",
	"hiringDate",
] as const;

export type EmployeeListSortColumn = (typeof EMPLOYEE_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY cognome (aligns with former client-side table UX). */
export const EMPLOYEE_LIST_DEFAULT_SORT: ListSort = {
	column: "surname",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former employees DataTable filters). */
export const EMPLOYEE_LIST_FILTER_IDS = [
	"taxCode",
	"name",
	"surname",
	"city",
	"province",
] as const;

export type EmployeeListFilterId = (typeof EMPLOYEE_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(EMPLOYEE_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Dipendenti list filters.
 * Only known text filter ids are applied (contains); blank/unknown ignored.
 */
export function buildEmployeeListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;
		clauses.push({ [key]: { contains: value } });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function employeeListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildEmployeeListWhere(filters)).length > 0;
}
