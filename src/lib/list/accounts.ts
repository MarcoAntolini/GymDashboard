import type { ListSort } from "@/lib/list";

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
	username: "Username",
	role: "Ruolo",
	approved: "Approvazione (si/no)",
};

export const ACCOUNT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "username", desc: false },
];
