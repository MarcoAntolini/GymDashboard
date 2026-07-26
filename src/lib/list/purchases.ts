import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native + join mappati nel data-access). */
export const PURCHASE_SORT_ALLOWLIST = [
	"id",
	"date",
	"clientId",
	"productCode",
	"amount",
	"duration",
	"entranceNumber",
	"client",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const PURCHASE_FILTER_ALLOWLIST = [
	"id",
	"clientId",
	"client",
	"productCode",
] as const;

/** Placeholder toolbar. */
export const PURCHASE_FILTER_LABELS: Record<
	(typeof PURCHASE_FILTER_ALLOWLIST)[number],
	string
> = {
	id: "ID Acquisto",
	clientId: "ID Cliente",
	client: "Cliente",
	productCode: "Codice prodotto",
};

export const PURCHASE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
