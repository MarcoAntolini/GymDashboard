import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const EQUIPMENT_SORT_ALLOWLIST = [
	"paymentId",
	"description",
	"provider",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const EQUIPMENT_FILTER_ALLOWLIST = [
	"provider",
	"description",
	"paymentId",
] as const;

export const EQUIPMENT_FILTER_LABELS: Record<
	(typeof EQUIPMENT_FILTER_ALLOWLIST)[number],
	string
> = {
	provider: "Fornitore",
	description: "Descrizione",
	paymentId: "ID Pagamento",
};

export const EQUIPMENT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "paymentId", desc: true },
];
