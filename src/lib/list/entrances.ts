import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native + join mappati nel data-access). */
export const ENTRANCE_SORT_ALLOWLIST = [
	"id",
	"date",
	"purchaseId",
	"client",
	"product",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const ENTRANCE_FILTER_ALLOWLIST = [
	"id",
	"purchaseId",
	"client",
	"product",
] as const;

/** Placeholder toolbar (evita confusione ID ingresso vs ID acquisto). */
export const ENTRANCE_FILTER_LABELS: Record<
	(typeof ENTRANCE_FILTER_ALLOWLIST)[number],
	string
> = {
	id: "ID Ingresso",
	purchaseId: "ID Acquisto",
	client: "Cliente",
	product: "Prodotto",
};

export const ENTRANCE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
