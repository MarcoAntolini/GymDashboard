import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import type { ListFacetedFilter, ListSort } from "@/lib/list";

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
	"type",
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
	type: "Tipo",
};

export const PURCHASE_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "type",
		title: "Tipo",
		options: (Object.values(ProductKind) as ProductKind[]).map((kind) => ({
			value: kind,
			label: PRODUCT_KIND_LABEL[kind],
		})),
	},
];

export const PURCHASE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
