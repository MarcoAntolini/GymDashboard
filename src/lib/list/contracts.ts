import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CONTRACT_SORT_ALLOWLIST = [
	"employeeId",
	"type",
	"hourlyFee",
	"startingDate",
	"endingDate",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CONTRACT_FILTER_ALLOWLIST = ["employeeId", "type"] as const;

export const CONTRACT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "employeeId", desc: false },
	{ id: "startingDate", desc: false },
];
