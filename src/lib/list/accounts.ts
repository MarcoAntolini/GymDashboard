import type { AppRole } from "@/data/nav-routes";
import { ROLE_LABEL } from "@/lib/domain/labels";
import type { ListFacetedFilter, ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const ACCOUNT_SORT_ALLOWLIST = ["employeeId", "username"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const ACCOUNT_FILTER_ALLOWLIST = [
	"employee",
	"username",
	"role",
	"approved",
] as const;

export const ACCOUNT_FILTER_LABELS: Record<
	(typeof ACCOUNT_FILTER_ALLOWLIST)[number],
	string
> = {
	employee: "Dipendente",
	username: "Nome utente",
	role: "Ruolo",
	approved: "Approvazione",
};

export const ACCOUNT_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "role",
		title: "Ruolo",
		options: (Object.keys(ROLE_LABEL) as AppRole[]).map((value) => ({
			value,
			label: ROLE_LABEL[value],
		})),
	},
	{
		key: "approved",
		title: "Approvazione",
		options: [
			{ value: "true", label: "Approvato" },
			{ value: "false", label: "Non approvato" },
		],
	},
];

export const ACCOUNT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "username", desc: false },
];
