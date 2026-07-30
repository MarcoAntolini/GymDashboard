import { CONTRACT_TYPE_LABEL } from "@/lib/domain/labels";
import type { ListFacetedFilter, ListSort } from "@/lib/list";
import { ContractType } from "@prisma/client";

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

export const CONTRACT_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "type",
		title: "Tipo contratto",
		options: (Object.keys(CONTRACT_TYPE_LABEL) as ContractType[]).map((value) => ({
			value,
			label: CONTRACT_TYPE_LABEL[value],
		})),
	},
];

export const CONTRACT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "employeeId", desc: false },
	{ id: "startingDate", desc: false },
];
