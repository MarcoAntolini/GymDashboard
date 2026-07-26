import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const ACCOUNT_SORT_ALLOWLIST = ["employeeId", "username"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const ACCOUNT_FILTER_ALLOWLIST = ["username", "role", "approved"] as const;

export const ACCOUNT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "username", desc: false },
];
