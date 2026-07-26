import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native; `kind` e' derivato -> escluso). */
export const CATALOG_SORT_ALLOWLIST = [
	"year",
	"productCode",
	"price",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CATALOG_FILTER_ALLOWLIST = ["year", "productCode"] as const;

/** Placeholder toolbar. */
export const CATALOG_FILTER_LABELS: Record<
	(typeof CATALOG_FILTER_ALLOWLIST)[number],
	string
> = {
	year: "Anno",
	productCode: "Codice prodotto",
};

export const CATALOG_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "year", desc: true },
	{ id: "productCode", desc: false },
];
