/**
 * Listino list-query helpers (ticket 26).
 *
 * Pure WHERE / sort contract for server-side Catalog lists — used by
 * `listCatalogs` in data-access. Filter keystrokes stay draft until Filtra.
 * Derived `productKind` is not a sortable/filterable DB column on Listino.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";

export const CATALOG_LIST_SORT_COLUMNS = [
	"year",
	"productCode",
	"price",
] as const;

export type CatalogListSortColumn = (typeof CATALOG_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY anno desc (matches former getAllCatalogs primary sort). */
export const CATALOG_LIST_DEFAULT_SORT: ListSort = {
	column: "year",
	direction: "desc",
};

/** Search filters shown in ServerListToolbar (former catalogs DataTable filters). */
export const CATALOG_LIST_FILTER_IDS = ["year", "productCode"] as const;

export type CatalogListFilterId = (typeof CATALOG_LIST_FILTER_IDS)[number];

const FILTER_ID_SET = new Set<string>(CATALOG_LIST_FILTER_IDS);

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

/**
 * Prisma `where` for Listino list filters.
 * `year` is exact int when parseable; `productCode` is contains.
 */
export function buildCatalogListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	for (const [key, raw] of Object.entries(filters)) {
		if (!FILTER_ID_SET.has(key)) continue;
		const value = filterString(raw);
		if (value === null) continue;

		switch (key as CatalogListFilterId) {
			case "productCode":
				clauses.push({ productCode: { contains: value } });
				break;
			case "year": {
				const year = Number.parseInt(value, 10);
				if (Number.isFinite(year) && String(year) === value) {
					clauses.push({ year });
				}
				break;
			}
		}
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function catalogListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildCatalogListWhere(filters)).length > 0;
}
