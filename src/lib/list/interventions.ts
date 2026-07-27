import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const INTERVENTION_SORT_ALLOWLIST = [
	"paymentId",
	"description",
	"maker",
	"startingTime",
	"endingTime",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const INTERVENTION_FILTER_ALLOWLIST = ["paymentId", "maker"] as const;

export const INTERVENTION_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
