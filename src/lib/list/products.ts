import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native; `kind` è derivato → escluso). */
export const PRODUCT_SORT_ALLOWLIST = ["code"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const PRODUCT_FILTER_ALLOWLIST = ["code"] as const;

/** Placeholder toolbar. */
export const PRODUCT_FILTER_LABELS: Record<
	(typeof PRODUCT_FILTER_ALLOWLIST)[number],
	string
> = {
	code: "Codice prodotto",
};

export const PRODUCT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "code", desc: false },
];
