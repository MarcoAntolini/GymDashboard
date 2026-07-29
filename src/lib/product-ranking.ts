/**
 * Ranking prodotti da Acquisti (ricavo + quantità) — mix Abbonamenti / Pacchetti.
 * Usa snapshot su Acquisto (duration / entranceNumber), non il Listino corrente.
 */
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";

export type PurchaseForRanking = {
	productCode: string;
	amount: number;
	duration: number | null;
	entranceNumber: number | null;
};

export type ProductRankingRow = {
	productCode: string;
	kind: ProductKind;
	kindLabel: string;
	amount: number;
	count: number;
};

export function rankProductsByRevenue(purchases: PurchaseForRanking[]): ProductRankingRow[] {
	const map = new Map<string, ProductRankingRow>();

	for (const row of purchases) {
		const kind = productKindFromSnapshot(row);
		const existing = map.get(row.productCode);
		if (existing) {
			existing.amount += row.amount;
			existing.count += 1;
			continue;
		}
		map.set(row.productCode, {
			productCode: row.productCode,
			kind,
			kindLabel: PRODUCT_KIND_LABEL[kind],
			amount: row.amount,
			count: 1,
		});
	}

	return [...map.values()].sort((a, b) => {
		if (b.amount !== a.amount) return b.amount - a.amount;
		if (b.count !== a.count) return b.count - a.count;
		return a.productCode.localeCompare(b.productCode, "it");
	});
}
