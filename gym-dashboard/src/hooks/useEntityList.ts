import {
	DEFAULT_LIST_QUERY,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { useCallback, useEffect, useRef, useState } from "react";

interface EntityListActions<T, K extends keyof T> {
	list: (query: ListQuery) => Promise<ListResult<T>>;
	deleteAction?: (entity: Pick<T, K>) => Promise<T>;
	editAction?: (entity: T) => Promise<T>;
}

type EntityKey<T> = keyof T;

function toError(error: unknown, fallback: string): Error {
	if (error instanceof Error && error.message.trim()) {
		return error;
	}
	return new Error(fallback);
}

function queriesEqual(a: ListQuery, b: ListQuery): boolean {
	return JSON.stringify(a) === JSON.stringify(b);
}

/**
 * Server-driven entity list: holds `ListQuery`, refetches on query change,
 * and refetches after mutations (unlike `useEntityData`, which patches local arrays).
 */
export function useEntityList<T, K extends EntityKey<T>>(
	actions: EntityListActions<T, K>,
	identifierKeys: K[],
	initialQuery: ListQuery = DEFAULT_LIST_QUERY
) {
	const [query, setQueryState] = useState<ListQuery>(initialQuery);
	const [data, setData] = useState<T[]>([]);
	const [total, setTotal] = useState(0);
	const [facets, setFacets] = useState<ListResult<T>["facets"]>({});
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);
	const requestIdRef = useRef(0);

	const setQuery = useCallback((next: ListQuery | ((prev: ListQuery) => ListQuery)) => {
		setQueryState((prev) => {
			const resolved = typeof next === "function" ? next(prev) : next;
			return queriesEqual(prev, resolved) ? prev : resolved;
		});
	}, []);

	const fetchData = useCallback(async (activeQuery: ListQuery = query) => {
		const requestId = ++requestIdRef.current;
		setIsLoading(true);
		setError(null);
		try {
			const result = await actions.list(activeQuery);
			if (requestId !== requestIdRef.current) return;
			setData(result.items);
			setTotal(result.total);
			setFacets(result.facets ?? {});
		} catch (err) {
			if (requestId !== requestIdRef.current) return;
			setError(toError(err, "Impossibile caricare i dati. Riprova."));
		} finally {
			if (requestId === requestIdRef.current) {
				setIsLoading(false);
			}
		}
	}, [actions, query]);

	useEffect(() => {
		void fetchData(query);
	}, [fetchData, query]);

	const retry = useCallback(() => {
		void fetchData(query);
	}, [fetchData, query]);

	const handleDelete = useCallback(
		async (deletedEntity: Pick<T, K>) => {
			if (actions.deleteAction) {
				await actions.deleteAction(deletedEntity);
			}
			await fetchData(query);
		},
		[actions, fetchData, query]
	);

	const handleEdit = useCallback(
		async (editedEntity: T) => {
			if (actions.editAction != null) {
				await actions.editAction(editedEntity);
			}
			await fetchData(query);
		},
		[actions, fetchData, query]
	);

	return {
		data,
		total,
		facets,
		query,
		setQuery,
		isLoading,
		error,
		retry,
		refetch: retry,
		handleDelete,
		handleEdit,
		/** @deprecated Prefer refetch after create; kept for rare local patches. */
		setData,
	};
}
