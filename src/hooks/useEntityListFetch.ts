"use client";

import { listFetchErrorMessage } from "@/lib/format/table-empty";
import { useCallback, useEffect, useState } from "react";

export type EntityListStatus = "loading" | "success" | "error";

export { listFetchErrorMessage };

/**
 * Shared list fetch lifecycle for entity pages (ticket 39).
 * - Initial load: status loading until first success/error
 * - Refetch: keeps prior result; status returns to loading
 * - Failure: status error + message; never leaves an infinite spinner
 */
export function useEntityListFetch<T>(load: () => Promise<T>) {
	const [result, setResult] = useState<T | null>(null);
	const [status, setStatus] = useState<EntityListStatus>("loading");
	const [error, setError] = useState<string | null>(null);
	const [retryCount, setRetryCount] = useState(0);

	const retry = useCallback(() => {
		setRetryCount((n) => n + 1);
	}, []);

	useEffect(() => {
		let cancelled = false;
		setStatus("loading");
		setError(null);

		void (async () => {
			try {
				const next = await load();
				if (cancelled) return;
				setResult(next);
				setStatus("success");
				setError(null);
			} catch (err: unknown) {
				if (cancelled) return;
				setStatus("error");
				setError(listFetchErrorMessage(err));
			}
		})();

		return () => {
			cancelled = true;
		};
	}, [load, retryCount]);

	const isInitialLoading = status === "loading" && result === null;
	const isLoading = status === "loading";

	const refresh = useCallback(async () => {
		setStatus("loading");
		setError(null);
		try {
			const next = await load();
			setResult(next);
			setStatus("success");
			setError(null);
		} catch (err: unknown) {
			setStatus("error");
			setError(listFetchErrorMessage(err));
		}
	}, [load]);

	return {
		result,
		status,
		error,
		isLoading,
		isInitialLoading,
		retry,
		refresh,
	};
}
