import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CLOCKING_SORT_ALLOWLIST = [
	"employee",
	"entranceTime",
	"exitTime",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CLOCKING_FILTER_ALLOWLIST = ["employee", "date"] as const;

/** Filtri data (Calendar shadcn), esclusi dalle textbox. */
export const CLOCKING_DATE_FILTERS = ["date"] as const;

export const CLOCKING_FILTER_LABELS: Record<
	(typeof CLOCKING_FILTER_ALLOWLIST)[number],
	string
> = {
	employee: "Dipendente",
	date: "Giornata",
};

export const CLOCKING_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "entranceTime", desc: true },
];
