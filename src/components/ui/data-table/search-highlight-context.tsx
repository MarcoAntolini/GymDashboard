"use client";

import { stringFilterTerms } from "@/lib/highlight-matches";
import type { ListFilters } from "@/lib/list";
import * as React from "react";

const SearchHighlightContext = React.createContext<ListFilters | undefined>(undefined);

/** Espone i filtri *applicati* (ultimo fetch) alle celle per l'highlight. */
export function SearchHighlightProvider({
	filters,
	children,
}: {
	filters: ListFilters | undefined;
	children: React.ReactNode;
}) {
	return (
		<SearchHighlightContext.Provider value={filters}>
			{children}
		</SearchHighlightContext.Provider>
	);
}

/**
 * Termini da evidenziare. Con `keys`: solo quelle chiavi; senza: tutti i filtri testuali.
 */
export function useSearchHighlightTerms(keys?: string | string[]): string[] {
	const filters = React.useContext(SearchHighlightContext);
	return stringFilterTerms(filters, keys);
}

/** Termine da evidenziare per le chiavi filtro indicate; null se assente. */
export function useSearchHighlightTerm(keys: string | string[]): string | null {
	return useSearchHighlightTerms(keys)[0] ?? null;
}
