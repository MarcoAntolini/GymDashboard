import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const BILL_SORT_ALLOWLIST = ["paymentId", "provider"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const BILL_FILTER_ALLOWLIST = [
	"provider",
	"description",
	"paymentId",
] as const;

export const BILL_FILTER_LABELS: Record<
	(typeof BILL_FILTER_ALLOWLIST)[number],
	string
> = {
	provider: "Fornitore",
	description: "Descrizione",
	paymentId: "ID Pagamento",
};

export const BILL_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
