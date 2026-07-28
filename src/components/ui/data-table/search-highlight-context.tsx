"use client";

import { stringFilterTerm } from "@/lib/highlight-matches";
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

/** Termine da evidenziare per le chiavi filtro indicate; null se assente. */
export function useSearchHighlightTerm(keys: string | string[]): string | null {
	const filters = React.useContext(SearchHighlightContext);
	return stringFilterTerm(filters, keys);
}
