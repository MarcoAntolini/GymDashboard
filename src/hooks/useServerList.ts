"use client";

import {
	DEFAULT_PAGE_SIZE,
	normalizeListQuery,
	type ListFilters,
	type ListQuery,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import type { OnChangeFn, PaginationState, SortingState } from "@tanstack/react-table";
import {
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from "react";

export type UseServerListOptions<T> = {
	/** Server action / data-access `list*(query)`. */
	list: (query: ListQuery) => Promise<ListResult<T>>;
	sortAllowlist: readonly string[];
	filterAllowlist?: readonly string[];
	defaultSort?: ListSort[];
	defaultPageSize?: number;
	initialFilters?: ListFilters;
	/** Se false, non fetcha al mount (default true). */
	enabled?: boolean;
};

export type UseServerListReturn<T> = {
	items: T[];
	total: number;
	pageCount: number;
	isLoading: boolean;
	error: Error | null;
	/** Filtri in bozza (keystroke) — non ancora applicati. */
	draftFilters: ListFilters;
	setDraftFilter: (key: string, value: string | string[] | undefined) => void;
	setDraftFilters: (filters: ListFilters) => void;
	/** Query applicata (ultimo fetch riuscito o in corso). */
	query: ListQuery;
	/** Applica draft → nuova query (Conferma/Filtra). Reset page a 1. */
	applyFilters: () => void;
	/** Pulisce draft + applicati e rifetch. */
	resetFilters: () => void;
	/** True se draft ≠ filtri applicati. */
	filtersDirty: boolean;
	sorting: SortingState;
	onSortingChange: OnChangeFn<SortingState>;
	pagination: PaginationState;
	onPaginationChange: OnChangeFn<PaginationState>;
	refetch: () => void;
	setItems: Dispatch<SetStateAction<T[]>>;
};

function sortingToListSort(sorting: SortingState): ListSort[] {
	return sorting.map((s) => ({ id: s.id, desc: s.desc }));
}

function listSortToSorting(sort: ListSort[]): SortingState {
	return sort.map((s) => ({ id: s.id, desc: !!s.desc }));
}

function filtersEqual(a: ListFilters, b: ListFilters): boolean {
	const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
	for (const key of keys) {
		const av = a[key];
		const bv = b[key];
		if (Array.isArray(av) || Array.isArray(bv)) {
			const aa = Array.isArray(av) ? av : [];
			const bb = Array.isArray(bv) ? bv : [];
			if (aa.length !== bb.length || aa.some((v, i) => v !== bb[i])) return false;
			continue;
		}
		const as = av == null ? "" : String(av);
		const bs = bv == null ? "" : String(bv);
		if (as !== bs) return false;
	}
	return true;
}

/**
 * Hook liste server-side: draft filters + Conferma, sort/page → re-query immediata.
 * Non sostituisce `useEntityData` finché l’entità non è migrata (ticket 20+).
 */
export function useServerList<T>(options: UseServerListOptions<T>): UseServerListReturn<T> {
	const {
		list,
		sortAllowlist,
		filterAllowlist,
		defaultSort,
		defaultPageSize = DEFAULT_PAGE_SIZE,
		initialFilters = {},
		enabled = true,
	} = options;

	const sortKey = sortAllowlist.join(",");
	const filterKey = filterAllowlist?.join(",") ?? "";
	const defaultSortKey = JSON.stringify(defaultSort ?? []);

	const normalize = useCallback(
		(input: Parameters<typeof normalizeListQuery>[0]) =>
			normalizeListQuery(input, {
				sortAllowlist,
				filterAllowlist,
				defaultSort,
				defaultPageSize: defaultPageSize as 10 | 20 | 30 | 40 | 50,
			}),
		// serialized keys keep allowlists stable without referential churn
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[sortKey, filterKey, defaultSortKey, defaultPageSize]
	);

	const [draftFilters, setDraftFiltersState] = useState<ListFilters>(initialFilters);
	const [query, setQuery] = useState<ListQuery>(() =>
		normalize({
			filters: initialFilters,
			sort: defaultSort,
			page: 1,
			pageSize: defaultPageSize,
		})
	);
	const [items, setItems] = useState<T[]>([]);
	const [total, setTotal] = useState(0);
	const [pageCount, setPageCount] = useState(0);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const requestId = useRef(0);
	const listRef = useRef(list);
	listRef.current = list;

	const fetchWith = useCallback(
		async (next: ListQuery) => {
			const id = ++requestId.current;
			setIsLoading(true);
			setError(null);
			try {
				const result = await listRef.current(next);
				if (id !== requestId.current) return;
				setItems(result.items);
				setTotal(result.total);
				setPageCount(result.pageCount);
				setQuery(
					normalize({
						filters: result.filters,
						sort: result.sort,
						page: result.page,
						pageSize: result.pageSize,
					})
				);
			} catch (e) {
				if (id !== requestId.current) return;
				setError(e instanceof Error ? e : new Error(String(e)));
			} finally {
				if (id === requestId.current) setIsLoading(false);
			}
		},
		[normalize]
	);

	useEffect(() => {
		if (!enabled) {
			setIsLoading(false);
			return;
		}
		void fetchWith(query);
		// mount / enabled only — subsequent fetches via explicit actions
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [enabled]);

	const setDraftFilter = useCallback((key: string, value: string | string[] | undefined) => {
		setDraftFiltersState((prev) => {
			const next = { ...prev };
			if (value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
				delete next[key];
			} else {
				next[key] = value;
			}
			return next;
		});
	}, []);

	const setDraftFilters = useCallback((filters: ListFilters) => {
		setDraftFiltersState(filters);
	}, []);

	const applyFilters = useCallback(() => {
		const next = normalize({ ...query, filters: draftFilters, page: 1 });
		setQuery(next);
		void fetchWith(next);
	}, [draftFilters, fetchWith, normalize, query]);

	const resetFilters = useCallback(() => {
		setDraftFiltersState({});
		const next = normalize({ ...query, filters: {}, page: 1 });
		setQuery(next);
		void fetchWith(next);
	}, [fetchWith, normalize, query]);

	const sorting = useMemo(() => listSortToSorting(query.sort), [query.sort]);

	const onSortingChange: OnChangeFn<SortingState> = useCallback(
		(updater) => {
			const prev = listSortToSorting(query.sort);
			const nextSorting = typeof updater === "function" ? updater(prev) : updater;
			const next = normalize({
				...query,
				sort: sortingToListSort(nextSorting),
				page: 1,
			});
			setQuery(next);
			void fetchWith(next);
		},
		[fetchWith, normalize, query]
	);

	const pagination: PaginationState = useMemo(
		() => ({
			pageIndex: Math.max(0, query.page - 1),
			pageSize: query.pageSize,
		}),
		[query.page, query.pageSize]
	);

	const onPaginationChange: OnChangeFn<PaginationState> = useCallback(
		(updater) => {
			const prev = {
				pageIndex: Math.max(0, query.page - 1),
				pageSize: query.pageSize,
			};
			const nextPag = typeof updater === "function" ? updater(prev) : updater;
			const next = normalize({
				...query,
				page: nextPag.pageIndex + 1,
				pageSize: nextPag.pageSize,
			});
			setQuery(next);
			void fetchWith(next);
		},
		[fetchWith, normalize, query]
	);

	const refetch = useCallback(() => {
		void fetchWith(query);
	}, [fetchWith, query]);

	const filtersDirty = !filtersEqual(draftFilters, query.filters);

	return {
		items,
		total,
		pageCount,
		isLoading,
		error,
		draftFilters,
		setDraftFilter,
		setDraftFilters,
		query,
		applyFilters,
		resetFilters,
		filtersDirty,
		sorting,
		onSortingChange,
		pagination,
		onPaginationChange,
		refetch,
		setItems,
	};
}
