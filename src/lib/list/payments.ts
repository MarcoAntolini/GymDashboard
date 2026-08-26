import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import type { ListFacetedFilter, ListSort } from "@/lib/list";
import { PaymentType } from "@prisma/client";

/** Colonne ammesse in ORDER BY (allineate agli header sortable UI). */
export const PAYMENT_SORT_ALLOWLIST = ["id", "date", "amount"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const PAYMENT_FILTER_ALLOWLIST = ["type", "id", "specialization"] as const;

export const PAYMENT_FILTER_LABELS: Record<
	(typeof PAYMENT_FILTER_ALLOWLIST)[number],
	string
> = {
	type: "Tipo pagamento",
	id: "ID Pagamento",
	specialization: "Dettaglio",
};

export const PAYMENT_FACETED_FILTERS: ListFacetedFilter[] = [
	{
		key: "type",
		title: "Tipo pagamento",
		options: (Object.keys(PAYMENT_TYPE_LABEL) as PaymentType[]).map((value) => ({
			value,
			label: PAYMENT_TYPE_LABEL[value],
		})),
	},
];

export const PAYMENT_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "date", desc: true },
];
