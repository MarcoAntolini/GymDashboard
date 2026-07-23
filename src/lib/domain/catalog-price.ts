/**
 * Listino price helpers: end-to-end Decimal at 2 fractional digits.
 * Form/Zod use a decimal string; Prisma writes use Prisma.Decimal.
 */

/** Positive amount with at most 2 decimal places (e.g. "12", "12.5", "12.50"). */
const PRICE_STRING_RE = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;

export function isValidCatalogPriceString(value: string): boolean {
	if (!PRICE_STRING_RE.test(value)) {
		return false;
	}
	return Number(value) > 0;
}

/** Normalize any Prisma Decimal / number / string to a 2-decimal display string. */
export function formatCatalogPrice(
	value: string | number | { toFixed: (digits: number) => string }
): string {
	if (typeof value === "object" && value != null && "toFixed" in value) {
		return value.toFixed(2);
	}
	const n = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(n)) {
		throw new Error(`Invalid catalog price: ${String(value)}`);
	}
	return n.toFixed(2);
}
