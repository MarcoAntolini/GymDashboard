/**
 * Prodotti list-query helpers (ticket 23).
 *
 * Pure WHERE / sort contract for server-side Prodotti lists — used by
 * `listProducts` in data-access. Filter keystrokes stay draft until Filtra.
 * Derived `productKind` is not a sortable DB column.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const PRODUCT_LIST_SORT_COLUMNS = ["code"] as const;

export type ProductListSortColumn = (typeof PRODUCT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY codice asc (PK / natural product listing). */
export const PRODUCT_LIST_DEFAULT_SORT: ListSort = {
	column: "code",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former products DataTable filters). */
export const PRODUCT_LIST_FILTER_IDS = ["code"] as const;

export type ProductListFilterId = (typeof PRODUCT_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(PRODUCT_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Prodotti list filters.
 * Only known text filter ids are applied (contains); blank/unknown ignored.
 */
export function buildProductListWhere(
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

export function productListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildProductListWhere(filters)).length > 0;
}
