import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";
import type { ListFacetedFilter, ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native + join mappati nel data-access). */
export const SALE_SORT_ALLOWLIST = [
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
export const SALE_FILTER_ALLOWLIST = [
	"id",
	"clientId",
	"client",
	"productCode",
	"type",
] as const;

/** Placeholder toolbar. */
export const SALE_FILTER_LABELS: Record<
	(typeof SALE_FILTER_ALLOWLIST)[number],
	string
> = {
	id: "ID Vendita",
	clientId: "ID Cliente",
	client: "Cliente",
	productCode: "Codice prodotto",
	type: "Tipo",
};

export const SALE_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "type",
		title: "Tipo",
		options: (Object.values(ProductKind) as ProductKind[]).map((kind) => ({
			value: kind,
			label: PRODUCT_KIND_LABEL[kind],
		})),
	},
];

export const SALE_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
