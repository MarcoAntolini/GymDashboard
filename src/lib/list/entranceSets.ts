import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native). */
export const ENTRANCE_SET_SORT_ALLOWLIST = [
	"productCode",
	"entranceNumber",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const ENTRANCE_SET_FILTER_ALLOWLIST = [
	"productCode",
	"entranceNumber",
] as const;

/** Placeholder toolbar. */
export const ENTRANCE_SET_FILTER_LABELS: Record<
	(typeof ENTRANCE_SET_FILTER_ALLOWLIST)[number],
	string
> = {
	productCode: "Codice prodotto",
	entranceNumber: "Numero ingressi",
};

export const ENTRANCE_SET_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "productCode", desc: false },
];
