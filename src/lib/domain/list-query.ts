/**
 * Shared list-query contract (ticket 19).
 *
 * Data-access lists should accept normalized params (filters + sort + page +
 * pageSize), run WHERE / ORDER BY / LIMIT+OFFSET (or equivalent Prisma
 * `where` / `orderBy` / `skip`+`take`) and return {@link ListQueryResult}
 * including total count for UI pagination.
 *
 * UI contract: filter inputs are **draft** until Conferma/Filtra; keystrokes
 * must not hit the backend. Column sort and page changes re-query immediately.
 *
 * Entity migrations (Clienti, …) start at tickets 20–35 — this module is the
 * reusable foundation only.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const PAGE_SIZE_OPTIONS = [10, 20, 30, 40, 50] as const;

export type SortDirection = "asc" | "desc";

export type ListSort = {
	column: string;
	direction: SortDirection;
};

export type ListFilterPrimitive = string | number | boolean | Date | null;

export type ListFilterValue = ListFilterPrimitive | readonly ListFilterPrimitive[];

export type ListFilters = Record<string, ListFilterValue | undefined>;

/** Raw caller input (URL, form, or hook state) before normalization. */
export type ListQueryInput = {
	filters?: ListFilters;
	sort?: ListSort | null;
	/** 1-based page index */
	page?: number;
	pageSize?: number;
};

export type NormalizeListQueryOptions = {
	allowedSortColumns?: readonly string[];
	defaultSort?: ListSort | null;
	defaultPageSize?: number;
	maxPageSize?: number;
};

/**
 * Normalized list query ready for data-access.
 * `skip` / `take` map 1:1 to SQL OFFSET / LIMIT (Prisma `skip` / `take`).
 */
export type ListQueryParams = {
	filters: ListFilters;
	sort: ListSort | null;
	page: number;
	pageSize: number;
	skip: number;
	take: number;
};

export type ListQueryResult<T> = {
	rows: T[];
	total: number;
	page: number;
	pageSize: number;
	pageCount: number;
};

export type ListEmptyKind = "dataset" | "filters";

export type ListIndexCandidate = {
	entity: string;
	/** Prisma / domain field names (not necessarily DB column names). */
	columns: readonly string[];
	reason: string;
	/** Alignment with docs/db-guidelines/16-indici.md */
	status: "present" | "candidate" | "pk-or-unique";
	prismaHint?: string;
};

/**
 * Candidate indexes for frequent WHERE / ORDER BY on entity lists.
 * Documented only — schema `@@index` additions belong to measured follow-ups
 * (see 16-indici.md: measure with EXPLAIN before adding).
 */
export const LIST_INDEX_CANDIDATES: readonly ListIndexCandidate[] = [
	{
		entity: "clienti",
		columns: ["taxCode"],
		reason: "Lookup Cliente by codice fiscale (CF)",
		status: "present",
		prismaHint: "@unique on taxCode",
	},
	{
		entity: "clienti",
		columns: ["surname", "name"],
		reason: "Default list ORDER BY cognome/nome + text filters",
		status: "candidate",
		prismaHint: "@@index([surname, name])",
	},
	{
		entity: "acquisti",
		columns: ["clientId", "date"],
		reason: "FK Cliente + range/sort by sale date",
		status: "candidate",
		prismaHint: "@@index([clientId, date])",
	},
	{
		entity: "ingressi",
		columns: ["purchaseId", "date"],
		reason: "Justification join + timestamp range/sort",
		status: "candidate",
		prismaHint: "@@index([purchaseId, date])",
	},
	{
		entity: "contratti",
		columns: ["employeeId", "startingDate"],
		reason: "PK already covers Dipendente + validity start",
		status: "pk-or-unique",
		prismaHint: "@@id([employeeId, startingDate])",
	},
	{
		entity: "timbrature",
		columns: ["employeeId", "entranceTime"],
		reason: "PK covers Dipendente + timestamp",
		status: "pk-or-unique",
		prismaHint: "@@id([employeeId, entranceTime])",
	},
	{
		entity: "pagamenti",
		columns: ["date", "type"],
		reason: "Economic movements filtered/sorted by data and tipo",
		status: "candidate",
		prismaHint: "@@index([date, type])",
	},
	{
		entity: "listino",
		columns: ["year", "productCode"],
		reason: "Listino PK year+product; list filters by anno",
		status: "pk-or-unique",
		prismaHint: "@@id([year, productCode])",
	},
] as const;

function isBlankString(value: unknown): boolean {
	return typeof value === "string" && value.trim() === "";
}

function sanitizeFilters(filters: ListFilters | undefined): ListFilters {
	if (!filters) return {};
	const out: ListFilters = {};
	for (const [key, value] of Object.entries(filters)) {
		if (value === undefined || value === null) continue;
		if (Array.isArray(value)) {
			if (value.length === 0) continue;
			out[key] = value;
			continue;
		}
		if (isBlankString(value)) continue;
		if (typeof value === "string") {
			out[key] = value.trim();
			continue;
		}
		out[key] = value;
	}
	return out;
}

function normalizeDirection(direction: unknown): SortDirection {
	return String(direction).toLowerCase() === "desc" ? "desc" : "asc";
}

function normalizeSort(
	sort: ListSort | null | undefined,
	options: NormalizeListQueryOptions
): ListSort | null {
	const fallback = options.defaultSort ?? null;
	if (!sort || !sort.column) return fallback;

	const direction = normalizeDirection(sort.direction);
	const allowed = options.allowedSortColumns;
	if (allowed && !allowed.includes(sort.column)) {
		return fallback;
	}
	return { column: sort.column, direction };
}

/**
 * Normalize caller input into a stable list query.
 * Page is 1-based; `skip`/`take` are ready for Prisma / SQL OFFSET+LIMIT.
 */
export function normalizeListQuery(
	input: ListQueryInput,
	options: NormalizeListQueryOptions = {}
): ListQueryParams {
	const maxPageSize = options.maxPageSize ?? MAX_PAGE_SIZE;
	const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;

	let pageSize =
		typeof input.pageSize === "number" && Number.isFinite(input.pageSize)
			? Math.trunc(input.pageSize)
			: defaultPageSize;
	if (pageSize < 1) pageSize = defaultPageSize;
	if (pageSize > maxPageSize) pageSize = maxPageSize;

	let page =
		typeof input.page === "number" && Number.isFinite(input.page)
			? Math.trunc(input.page)
			: 1;
	if (page < 1) page = 1;

	const filters = sanitizeFilters(input.filters);
	const sort = normalizeSort(input.sort, options);
	const skip = (page - 1) * pageSize;

	return {
		filters,
		sort,
		page,
		pageSize,
		skip,
		take: pageSize,
	};
}

/** Prisma `skip` / `take` alias for server-side LIMIT/OFFSET pagination. */
export function toPrismaSkipTake(params: Pick<ListQueryParams, "skip" | "take">): {
	skip: number;
	take: number;
} {
	return { skip: params.skip, take: params.take };
}

export function listPageCount(total: number, pageSize: number): number {
	if (total <= 0 || pageSize <= 0) return 0;
	return Math.ceil(total / pageSize);
}

export function buildListResult<T>(
	rows: T[],
	total: number,
	params: Pick<ListQueryParams, "page" | "pageSize">
): ListQueryResult<T> {
	return {
		rows,
		total,
		page: params.page,
		pageSize: params.pageSize,
		pageCount: listPageCount(total, params.pageSize),
	};
}

/**
 * Single-field Prisma `orderBy` object from list sort.
 * Multi-column defaults can be composed by the caller after this helper.
 */
export function prismaOrderBy(
	sort: ListSort | null,
	fallback?: ListSort | null
): Record<string, SortDirection> | undefined {
	const effective = sort ?? fallback ?? null;
	if (!effective) return undefined;
	return { [effective.column]: effective.direction };
}

/**
 * Empty-state kind for list shells:
 * - `dataset` — no rows in the table at all
 * - `filters` — rows exist, but applied filters match nothing
 * - `null` — current page has rows
 */
export function listEmptyKind(args: {
	totalUnfiltered: number;
	total: number;
	rowCount: number;
}): ListEmptyKind | null {
	if (args.rowCount > 0) return null;
	if (args.totalUnfiltered <= 0) return "dataset";
	if (args.total <= 0) return "filters";
	return null;
}

/** Minimal TanStack `SortingState` entry shape (avoids a hard UI dependency). */
export type TanstackSortEntry = { id: string; desc: boolean };

/**
 * Map TanStack column sorting → list sort for a new DB ORDER BY query.
 * Only the first sorted column is used (single-column contract for tickets 20–35).
 */
export function listSortFromTanstack(
	sorting: readonly TanstackSortEntry[]
): ListSort | null {
	const first = sorting[0];
	if (!first?.id) return null;
	return { column: first.id, direction: first.desc ? "desc" : "asc" };
}

/** Map list sort → TanStack `SortingState` for controlled headers. */
export function tanstackSortingFromListSort(
	sort: ListSort | null
): TanstackSortEntry[] {
	if (!sort) return [];
	return [{ id: sort.column, desc: sort.direction === "desc" }];
}

/**
 * Suggested TanStack Table flags for server-driven lists:
 * `manualFiltering`, `manualSorting`, `manualPagination`, plus `rowCount: total`.
 * Wire sort via {@link listSortFromTanstack} and page via {@link ListQueryParams}.
 */
export const SERVER_TABLE_MANUAL_FLAGS = {
	manualFiltering: true,
	manualSorting: true,
	manualPagination: true,
} as const;
