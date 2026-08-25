import type { ListFacetedFilter, ListSort } from "@/lib/list";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
} from "@/lib/domain/product-kind";

/** Colonne ammesse in ORDER BY (`kind`/`description`/`active` non sortable in UI). */
export const PRODUCT_SORT_ALLOWLIST = ["code"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const PRODUCT_FILTER_ALLOWLIST = [
	"code",
	"description",
	"kind",
	"active",
] as const;

/** Placeholder toolbar. */
export const PRODUCT_FILTER_LABELS: Record<
	(typeof PRODUCT_FILTER_ALLOWLIST)[number],
	string
> = {
	code: "Codice prodotto",
	description: "Descrizione",
	kind: "Tipo",
	active: "Stato",
};

export const PRODUCT_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "kind",
		title: "Tipo",
		options: [
			{
				label: PRODUCT_KIND_LABEL[ProductKind.Membership],
				value: ProductKind.Membership,
			},
			{
				label: PRODUCT_KIND_LABEL[ProductKind.EntranceSet],
				value: ProductKind.EntranceSet,
			},
		],
	},
	{
		key: "active",
		title: "Stato",
		options: [
			{ label: "Attivo", value: "true" },
			{ label: "Archiviato", value: "false" },
		],
	},
];

export const PRODUCT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "code", desc: false },
];
