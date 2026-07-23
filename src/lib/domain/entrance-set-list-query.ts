/**
 * Pacchetti ingressi list-query helpers (ticket 25).
 *
 * Pure WHERE / sort contract for server-side EntranceSet lists — used by
 * `listEntranceSets` in data-access. Filter keystrokes stay draft until Filtra.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const ENTRANCE_SET_LIST_SORT_COLUMNS = [
	"productCode",
	"entranceNumber",
] as const;

export type EntranceSetListSortColumn =
	(typeof ENTRANCE_SET_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY codice_prodotto asc (PK / natural listing). */
export const ENTRANCE_SET_LIST_DEFAULT_SORT: ListSort = {
	column: "productCode",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former entrance-sets DataTable filters). */
export const ENTRANCE_SET_LIST_FILTER_IDS = [
	"productCode",
	"entranceNumber",
] as const;

export type EntranceSetListFilterId =
	(typeof ENTRANCE_SET_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(ENTRANCE_SET_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Pacchetti ingressi list filters.
 * `productCode` is contains; `entranceNumber` is exact int when parseable.
 */
export function buildEntranceSetListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;

		switch (key as EntranceSetListFilterId) {
			case "productCode":
				clauses.push({ productCode: { contains: value } });
				break;
			case "entranceNumber": {
				const entranceNumber = Number.parseInt(value, 10);
				if (
					Number.isFinite(entranceNumber) &&
					String(entranceNumber) === value
				) {
					clauses.push({ entranceNumber });
				}
				break;
			}
		}
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function entranceSetListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildEntranceSetListWhere(filters)).length > 0;
}
