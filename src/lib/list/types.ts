/**
 * Contratto liste server-side (ticket 19).
 * Filtri applicati solo su Conferma; sort e paginazione rieseguono la query.
 */

export type SortDirection = "asc" | "desc";

/** Ordinamento colonna (id = chiave allowlist / campo Prisma sicuro). */
export type ListSort = {
	id: string;
	desc?: boolean;
};

/**
 * Filtri draft/applicati.
 * string → contains / eq a seconda del builder entity;
 * string[] → IN / faceted;
 * null/undefined → assente.
 */
export type ListFilterValue = string | string[] | number | boolean | null | undefined;

export type ListFilters = Record<string, ListFilterValue>;

/** Opzione per filtri faceted (enum/boolean) in toolbar. */
export type ListFacetedFilterOption = {
	label: string;
	value: string;
};

/** Definizione filtro a valori chiusi (multi-select). */
export type ListFacetedFilter = {
	key: string;
	title?: string;
	options: ListFacetedFilterOption[];
};

/** Query normalizzata inviata al data-access `list*`. */
export type ListQuery = {
	filters: ListFilters;
	sort: ListSort[];
	/** 1-based */
	page: number;
	pageSize: number;
};

export type ListResult<T> = {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
	sort: ListSort[];
	filters: ListFilters;
};

export const DEFAULT_PAGE_SIZE = 10;

export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

export type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number];

export type ListQueryInput = Partial<{
	filters: ListFilters;
	sort: ListSort[];
	page: number;
	pageSize: number;
}>;
