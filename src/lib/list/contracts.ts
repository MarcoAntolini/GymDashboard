import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CONTRACT_SORT_ALLOWLIST = [
	"employeeId",
	"type",
	"hourlyFee",
	"startingDate",
	"endingDate",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). Preferisci Dipendente rispetto al solo ID. */
export const CONTRACT_FILTER_ALLOWLIST = ["employee", "type"] as const;

export const CONTRACT_FILTER_LABELS: Record<
	(typeof CONTRACT_FILTER_ALLOWLIST)[number],
	string
> = {
	employee: "Dipendente",
	type: "Tipo contratto",
};

export const CONTRACT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "employeeId", desc: false },
	{ id: "startingDate", desc: false },
];
