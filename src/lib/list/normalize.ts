import {
	DEFAULT_PAGE_SIZE,
	PAGE_SIZE_OPTIONS,
	type ListFilters,
	type ListQuery,
	type ListQueryInput,
	type ListResult,
	type ListSort,
	type PageSizeOption,
} from "./types";

export type NormalizeListQueryOptions = {
	/** Colonne ammesse in ORDER BY (anti-injection / campi non-indexabili). */
	sortAllowlist: readonly string[];
	defaultSort?: ListSort[];
	defaultPageSize?: PageSizeOption;
	/** Chiavi filtro ammesse; altre vengono scartate. */
	filterAllowlist?: readonly string[];
};

function clampPageSize(raw: number | undefined, fallback: PageSizeOption): PageSizeOption {
	if (raw == null || !Number.isFinite(raw)) return fallback;
	const n = Math.trunc(raw);
	if ((PAGE_SIZE_OPTIONS as readonly number[]).includes(n)) {
		return n as PageSizeOption;
	}
	return fallback;
}

function clampPage(raw: number | undefined): number {
	if (raw == null || !Number.isFinite(raw)) return 1;
	return Math.max(1, Math.trunc(raw));
}

function sanitizeFilters(
	filters: ListFilters | undefined,
	allowlist?: readonly string[]
): ListFilters {
	if (!filters) return {};
	const out: ListFilters = {};
	for (const [key, value] of Object.entries(filters)) {
		if (allowlist && !allowlist.includes(key)) continue;
		if (value === undefined || value === null) continue;
		if (typeof value === "string" && value.trim() === "") continue;
		if (Array.isArray(value) && value.length === 0) continue;
		out[key] = value;
	}
	return out;
}

function sanitizeSort(sort: ListSort[] | undefined, allowlist: readonly string[]): ListSort[] {
	if (!sort?.length) return [];
	const allowed = new Set(allowlist);
	const seen = new Set<string>();
	const out: ListSort[] = [];
	for (const entry of sort) {
		if (!entry?.id || !allowed.has(entry.id) || seen.has(entry.id)) continue;
		seen.add(entry.id);
		out.push({ id: entry.id, desc: !!entry.desc });
	}
	return out;
}

/**
 * Normalizza input UI/API in un `ListQuery` sicuro:
 * page ≥ 1, pageSize in allowlist, sort/filter solo su allowlist.
 */
export function normalizeListQuery(
	input: ListQueryInput | undefined,
	options: NormalizeListQueryOptions
): ListQuery {
	const defaultPageSize = options.defaultPageSize ?? DEFAULT_PAGE_SIZE;
	const filters = sanitizeFilters(input?.filters, options.filterAllowlist);
	let sort = sanitizeSort(input?.sort, options.sortAllowlist);
	if (sort.length === 0 && options.defaultSort?.length) {
		sort = sanitizeSort(options.defaultSort, options.sortAllowlist);
	}
	return {
		filters,
		sort,
		page: clampPage(input?.page),
		pageSize: clampPageSize(input?.pageSize, defaultPageSize),
	};
}

export function pageCountFromTotal(total: number, pageSize: number): number {
	if (total <= 0) return 0;
	return Math.ceil(total / pageSize);
}

/**
 * Costruisce `ListResult` dopo findMany + count.
 * Se `page` supera `pageCount`, non ricalcola — il caller può ri-query con page clampata.
 */
export function buildListResult<T>(
	items: T[],
	total: number,
	query: ListQuery
): ListResult<T> {
	const pageCount = pageCountFromTotal(total, query.pageSize);
	return {
		items,
		total,
		page: query.page,
		pageSize: query.pageSize,
		pageCount,
		sort: query.sort,
		filters: query.filters,
	};
}

/** Clampa `page` entro [1, pageCount] (pageCount 0 → 1). */
export function clampPageToTotal(page: number, pageCount: number): number {
	if (pageCount <= 0) return 1;
	return Math.min(Math.max(1, page), pageCount);
}
