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
	"purchaseId",
	"client",
	"product",
] as const;

export const ENTRANCE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
