import type { ListSort } from "@/lib/list";

/** Colonne ammesse in ORDER BY (native). */
export const MEMBERSHIP_SORT_ALLOWLIST = ["productCode", "duration"] as const;

/** Chiavi filtro ammesse (Conferma/Filtra). */
export const MEMBERSHIP_FILTER_ALLOWLIST = ["productCode", "duration"] as const;

/** Placeholder toolbar. */
export const MEMBERSHIP_FILTER_LABELS: Record<
	(typeof MEMBERSHIP_FILTER_ALLOWLIST)[number],
	string
> = {
	productCode: "Codice prodotto",
	duration: "Durata (giorni)",
};

export const MEMBERSHIP_DEFAULT_SORT: readonly ListSort[] = [
	{ id: "productCode", desc: false },
];
