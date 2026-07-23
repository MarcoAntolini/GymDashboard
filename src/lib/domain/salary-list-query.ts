/**
 * Stipendi list-query helpers (ticket 31).
 *
 * Pure WHERE / sort contract for server-side Stipendi lists — used by
 * `listSalaries` in data-access. Filter keystrokes stay draft until Filtra.
 * Former client-side paymentId/employeeId filters become exact-match ints.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const SALARY_LIST_SORT_COLUMNS = ["paymentId", "employeeId"] as const;

export type SalaryListSortColumn = (typeof SALARY_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id pagamento (PK). */
export const SALARY_LIST_DEFAULT_SORT: ListSort = {
	column: "paymentId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Stipendi DataTable filters). */
export const SALARY_LIST_FILTER_IDS = ["paymentId", "employeeId"] as const;

export type SalaryListFilterId = (typeof SALARY_LIST_FILTER_IDS)[number];

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parsePositiveInt(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Prisma `where` for Stipendi list filters.
 * paymentId/employeeId: exact when parseable.
 */
export function buildSalaryListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const paymentIdRaw = filterString(filters.paymentId);
	if (paymentIdRaw !== null) {
		const paymentId = parsePositiveInt(paymentIdRaw);
		if (paymentId !== null) clauses.push({ paymentId });
	}

	const employeeIdRaw = filterString(filters.employeeId);
	if (employeeIdRaw !== null) {
		const employeeId = parsePositiveInt(employeeIdRaw);
		if (employeeId !== null) clauses.push({ employeeId });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function salaryListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildSalaryListWhere(filters)).length > 0;
}
