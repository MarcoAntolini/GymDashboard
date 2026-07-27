import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const PAYMENT_SORT_ALLOWLIST = ["id", "date", "amount", "type"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const PAYMENT_FILTER_ALLOWLIST = ["id", "type"] as const;

export const PAYMENT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
