/**
 * Timbrature list-query helpers (ticket 30).
 *
 * Pure WHERE / sort contract for server-side Timbrature lists — used by
 * `listClockings` in data-access. Filter keystrokes stay draft until Filtra.
 * Former client-side employeeId filter becomes exact-match int.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const CLOCKING_LIST_SORT_COLUMNS = [
	"employeeId",
	"entranceTime",
	"exitTime",
] as const;

export type ClockingListSortColumn = (typeof CLOCKING_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY entrata desc (recent punches first). */
export const CLOCKING_LIST_DEFAULT_SORT: ListSort = {
	column: "entranceTime",
	direction: "desc",
};

/** Search filters shown in ServerListToolbar (former Timbrature DataTable filters). */
export const CLOCKING_LIST_FILTER_IDS = ["employeeId"] as const;

export type ClockingListFilterId = (typeof CLOCKING_LIST_FILTER_IDS)[number];

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parseEmployeeId(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Prisma `where` for Timbrature list filters.
 * employeeId: exact when parseable.
 */
export function buildClockingListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const employeeIdRaw = filterString(filters.employeeId);
	if (employeeIdRaw !== null) {
		const employeeId = parseEmployeeId(employeeIdRaw);
		if (employeeId !== null) clauses.push({ employeeId });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function clockingListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildClockingListWhere(filters)).length > 0;
}
