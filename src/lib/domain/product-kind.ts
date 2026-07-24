/** Tipo prodotto in UI (non persistito su Acquisto — derivato da specializzazione / snapshot). */
export const ProductKind = {
	Membership: "Membership",
	EntranceSet: "EntranceSet",
} as const;

export type ProductKind = (typeof ProductKind)[keyof typeof ProductKind];

export const PRODUCT_KIND_LABEL: Record<ProductKind, string> = {
	Membership: "Abbonamento",
	EntranceSet: "Pacchetto ingressi",
};

export function productKindFromSnapshot(purchase: {
	duration: number | null;
	entranceNumber: number | null;
}): ProductKind {
	return purchase.duration != null ? ProductKind.Membership : ProductKind.EntranceSet;
}

/** Tipo derivato dalla specializzazione Prodotto (membership XOR entranceSet). */
export function productKindFromProduct(product: {
	membership: unknown | null;
	entranceSet: unknown | null;
}): ProductKind | null {
	if (product.membership) return ProductKind.Membership;
	if (product.entranceSet) return ProductKind.EntranceSet;
	return null;
}
