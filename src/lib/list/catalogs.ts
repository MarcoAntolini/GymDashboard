import {
	PRODUCT_KIND_LABEL,
	type ProductKind,
} from "@/lib/domain/product-kind";
import type { ListFacetedFilter, ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native; `kind` e' derivato -> escluso). */
export const CATALOG_SORT_ALLOWLIST = [
	"year",
	"productCode",
	"price",
] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const CATALOG_FILTER_ALLOWLIST = ["year", "kind", "productCode"] as const;

/** Placeholder toolbar. */
export const CATALOG_FILTER_LABELS: Record<
	(typeof CATALOG_FILTER_ALLOWLIST)[number],
	string
> = {
	year: "Anno",
	kind: "Tipo",
	productCode: "Codice prodotto",
};

export const CATALOG_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "kind",
		title: "Tipo",
		options: (Object.keys(PRODUCT_KIND_LABEL) as ProductKind[]).map((value) => ({
			value,
			label: PRODUCT_KIND_LABEL[value],
		})),
	},
];

export const CATALOG_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "year", desc: true },
	{ id: "productCode", desc: false },
];
