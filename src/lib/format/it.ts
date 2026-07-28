/**
 * Formattazione IT per liste operative (DESIGN.md).
 * Date: mese abbreviato italiano (`24 ott 2018`), non `gg/mm/aaaa`.
 * Importi: `it-IT` + EUR.
 */

const DATE_IT: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	year: "numeric",
};

const DATETIME_IT: Intl.DateTimeFormatOptions = {
	day: "numeric",
	month: "short",
	year: "numeric",
	hour: "2-digit",
	minute: "2-digit",
};

export function formatDateIt(value: Date | string | number): string {
	return new Date(value).toLocaleDateString("it-IT", DATE_IT);
}

export function formatDateTimeIt(value: Date | string | number): string {
	return new Date(value).toLocaleString("it-IT", DATETIME_IT);
}

export function formatEur(amount: number | string | { toString(): string }): string {
	return new Intl.NumberFormat("it-IT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(amount));
}
