import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CLOCKING_SORT_ALLOWLIST = [
	"employeeId",
	"entranceTime",
	"exitTime",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CLOCKING_FILTER_ALLOWLIST = ["employeeId"] as const;

export const CLOCKING_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "entranceTime", desc: true },
];
