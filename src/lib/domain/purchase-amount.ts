/**
 * Acquisto importo: Decimal end-to-end with Listino (YEAR(date), productCode) default.
 * Forms use ≤2-decimal strings; Prisma writes use Prisma.Decimal.
 */

import {
	formatCatalogPrice,
	isValidCatalogPriceString,
} from "./catalog-price";

/** Calendar year for Listino lookup from Acquisto date (YEAR(date)). */
export function catalogYearFromDate(date: Date): number {
	return date.getFullYear();
}

/**
 * Resolve create importo: explicit override (sconto) wins; else Listino price.
 * Throws if neither is a usable positive ≤2-decimal amount.
 */
export function resolvePurchaseAmountString(
	override: string | null | undefined,
	catalogPrice: string | null | undefined
): string {
	const trimmed = override?.trim();
	if (trimmed) {
		if (!isValidCatalogPriceString(trimmed)) {
			throw new Error(
				"Importo non valido: usa un importo positivo con al massimo 2 decimali"
			);
		}
		return formatCatalogPrice(trimmed);
	}
	if (catalogPrice != null && String(catalogPrice).trim() !== "") {
		return formatCatalogPrice(catalogPrice);
	}
	throw new Error(
		"Importo obbligatorio: nessun prezzo Listino per anno e prodotto selezionati"
	);
}
