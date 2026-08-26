import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native + join mappati nel data-access). */
export const ENTRANCE_SORT_ALLOWLIST = [
	"id",
	"date",
	"saleId",
	"client",
	"product",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const ENTRANCE_FILTER_ALLOWLIST = [
	"id",
	"saleId",
	"client",
	"product",
	"date",
] as const;

/** Filtri data (Calendar shadcn), esclusi dalle textbox. */
export const ENTRANCE_DATE_FILTERS = ["date"] as const;

/** Placeholder toolbar (evita confusione ID ingresso vs ID vendita). */
export const ENTRANCE_FILTER_LABELS: Record<
	(typeof ENTRANCE_FILTER_ALLOWLIST)[number],
	string
> = {
	id: "ID Ingresso",
	saleId: "ID Vendita",
	client: "Cliente",
	product: "Prodotto",
	date: "Giornata",
};

export const ENTRANCE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
