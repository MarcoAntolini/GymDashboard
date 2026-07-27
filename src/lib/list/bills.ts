import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const BILL_SORT_ALLOWLIST = [
	"paymentId",
	"description",
	"provider",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const BILL_FILTER_ALLOWLIST = ["paymentId", "provider"] as const;

export const BILL_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
