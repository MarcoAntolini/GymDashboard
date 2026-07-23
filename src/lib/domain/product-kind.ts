/**
 * UI/filter kind for Prodotto specialization (Abbonamento vs Pacchetto).
 * Not persisted on Listino / Acquisto — derived from membership XOR entranceSet.
 */

export const PRODUCT_KINDS = ["Membership", "EntranceSet"] as const;
export type ProductKind = (typeof PRODUCT_KINDS)[number];

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
	Membership: "Abbonamento",
	EntranceSet: "Pacchetto ingressi",
};

export type ProductSpecialization = {
	membership: unknown | null;
	entranceSet: unknown | null;
};

/** Derive kind from Prodotto specializations; null if missing or both present. */
export function deriveProductKind(
	product: ProductSpecialization
): ProductKind | null {
	const hasMembership = product.membership != null;
	const hasEntranceSet = product.entranceSet != null;
	if (hasMembership && !hasEntranceSet) {
		return "Membership";
	}
	if (hasEntranceSet && !hasMembership) {
		return "EntranceSet";
	}
	return null;
}

export function productMatchesKind(
	product: ProductSpecialization,
	kind: ProductKind
): boolean {
	return deriveProductKind(product) === kind;
}
