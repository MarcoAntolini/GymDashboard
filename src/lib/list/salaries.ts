import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const SALARY_SORT_ALLOWLIST = ["paymentId", "employeeId"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const SALARY_FILTER_ALLOWLIST = ["paymentId", "employeeId"] as const;

export const SALARY_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
