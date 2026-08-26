import {
	APP_CONTRACT_TYPE_LABEL,
	type AppContractType,
} from "@/lib/domain/contract-type";
import type { ListFacetedFilter, ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const CONTRACT_SORT_ALLOWLIST = [
	"employee",
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

export const CONTRACT_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "type",
		title: "Tipo contratto",
		options: (Object.keys(APP_CONTRACT_TYPE_LABEL) as AppContractType[]).map(
			(value) => ({
				value,
				label: APP_CONTRACT_TYPE_LABEL[value],
			})
		),
	},
];

export const CONTRACT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "employee", desc: false },
	{ id: "startingDate", desc: false },
];
