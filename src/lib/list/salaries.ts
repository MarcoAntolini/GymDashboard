import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const SALARY_SORT_ALLOWLIST = [
	"employee",
	"paymentDate",
	"paymentAmount",
	"paymentId",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). Preferisci Dipendente rispetto al solo ID. */
export const SALARY_FILTER_ALLOWLIST = ["employee", "paymentId"] as const;

export const SALARY_FILTER_LABELS: Record<
	(typeof SALARY_FILTER_ALLOWLIST)[number],
	string
> = {
	employee: "Dipendente",
	paymentId: "ID Pagamento",
};

export const SALARY_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
