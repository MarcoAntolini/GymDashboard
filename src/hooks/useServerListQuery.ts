"use client";

import {
	DEFAULT_PAGE_SIZE,
	type ListFilters,
	type ListQueryInput,
	type ListQueryParams,
	type ListSort,
	type NormalizeListQueryOptions,
	normalizeListQuery,
} from "@/lib/domain/list-query";
import { useCallback, useMemo, useState } from "react";

export type ServerListFilterDraft = Record<string, string>;

export type UseServerListQueryOptions = NormalizeListQueryOptions & {
	initialFilters?: ServerListFilterDraft;
	initialSort?: ListSort | null;
	initialPage?: number;
	initialPageSize?: number;
};

function draftToFilters(draft: ServerListFilterDraft): ListFilters {
	const filters: ListFilters = {};
	for (const [key, value] of Object.entries(draft)) {
		filters[key] = value;
	}
	return filters;
}

function filtersEqual(a: ServerListFilterDraft, b: ServerListFilterDraft): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		if ((a[key] ?? "") !== (b[key] ?? "")) return false;
	}
	return true;
}

/**
 * Client state for server-side lists (ticket 19).
 *
 * - Filter inputs update **draft** only; {@link applyFilters} copies draft → applied
 *   and resets to page 1 (Conferma/Filtra). Keystrokes never change `query`.
 * - Sort / page / pageSize update applied query immediately (re-fetch trigger).
 */
export function useServerListQuery(options: UseServerListQueryOptions = {}) {
	const initialFilters = options.initialFilters ?? {};
	const initialSort = options.initialSort ?? options.defaultSort ?? null;
	const initialPage = options.initialPage ?? 1;
	const initialPageSize =
		options.initialPageSize ?? options.defaultPageSize ?? DEFAULT_PAGE_SIZE;

	const [draftFilters, setDraftFilters] =
		useState<ServerListFilterDraft>(initialFilters);
	const [appliedFilters, setAppliedFilters] =
		useState<ServerListFilterDraft>(initialFilters);
	const [sort, setSortState] = useState<ListSort | null>(initialSort);
	const [page, setPageState] = useState(initialPage);
	const [pageSize, setPageSizeState] = useState(initialPageSize);

	const input: ListQueryInput = useMemo(
		() => ({
			filters: draftToFilters(appliedFilters),
			sort,
			page,
			pageSize,
		}),
		[appliedFilters, sort, page, pageSize]
	);

	const query: ListQueryParams = normalizeListQuery(input, {
		allowedSortColumns: options.allowedSortColumns,
		defaultSort: options.defaultSort,
		defaultPageSize: options.defaultPageSize,
		maxPageSize: options.maxPageSize,
	});

	const isFilterDirty = !filtersEqual(draftFilters, appliedFilters);
	const hasAppliedFilters = Object.values(appliedFilters).some((v) => v.trim() !== "");

	const setDraftFilter = useCallback((key: string, value: string) => {
		setDraftFilters((prev) => ({ ...prev, [key]: value }));
	}, []);

	const applyFilters = useCallback(() => {
		setAppliedFilters({ ...draftFilters });
		setPageState(1);
	}, [draftFilters]);

	const resetFilters = useCallback(() => {
		const empty: ServerListFilterDraft = {};
		for (const key of new Set([
			...Object.keys(draftFilters),
			...Object.keys(appliedFilters),
		])) {
			empty[key] = "";
		}
		setDraftFilters(empty);
		setAppliedFilters(empty);
		setPageState(1);
	}, [draftFilters, appliedFilters]);

	/** Column sort → new DB ORDER BY; always reset to first page. */
	const setSort = useCallback((next: ListSort | null) => {
		setSortState(next);
		setPageState(1);
	}, []);

	const setPage = useCallback((next: number) => {
		setPageState(Math.max(1, Math.trunc(next)));
	}, []);

	const setPageSize = useCallback((next: number) => {
		setPageSizeState(next);
		setPageState(1);
	}, []);

	return {
		draftFilters,
		appliedFilters,
		setDraftFilter,
		setDraftFilters,
		applyFilters,
		resetFilters,
		isFilterDirty,
		hasAppliedFilters,
		sort,
		setSort,
		page,
		setPage,
		pageSize,
		setPageSize,
		/** Normalized applied query — pass to data-access list helpers. */
		query,
		input,
	};
}
