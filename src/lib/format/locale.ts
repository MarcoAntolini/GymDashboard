/**
 * Italian locale display helpers for list/detail tables (ticket 36).
 * Dates: abbreviated month (`24 ott 2018`) per DESIGN.md.
 * Money: EUR with it-IT grouping/decimals.
 */

export const APP_LOCALE = "it-IT";
export const APP_CURRENCY = "EUR";

const dateFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
	day: "numeric",
	month: "short",
	year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat(APP_LOCALE, {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
});

const currencyFormatter = new Intl.NumberFormat(APP_LOCALE, {
	style: "currency",
	currency: APP_CURRENCY,
});

function toDate(value: Date | string | number): Date {
	return value instanceof Date ? value : new Date(value);
}

/** Calendar date for lists: `24 ott 2018`. */
export function formatDateIt(value: Date | string | number): string {
	return dateFormatter.format(toDate(value));
}

/** Date + time for Ingressi / Timbrature-style columns. */
export function formatDateTimeIt(value: Date | string | number): string {
	return dateTimeFormatter.format(toDate(value));
}

/** EUR amount with Italian grouping (e.g. `1.234,56 €`). */
export function formatCurrencyEur(value: number | string): string {
	const amount = typeof value === "number" ? value : Number.parseFloat(value);
	if (!Number.isFinite(amount)) return "—";
	return currencyFormatter.format(amount);
}
