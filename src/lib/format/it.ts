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

const TIME_IT: Intl.DateTimeFormatOptions = {
	hour: "2-digit",
	minute: "2-digit",
	hour12: false,
};

function toDate(value: Date | string | number): Date {
	return value instanceof Date ? value : new Date(value);
}

export function formatDateIt(value: Date | string | number): string {
	return toDate(value).toLocaleDateString("it-IT", DATE_IT);
}

export function formatTimeIt(value: Date | string | number): string {
	return toDate(value).toLocaleTimeString("it-IT", TIME_IT);
}

export function formatDateTimeIt(value: Date | string | number): string {
	return toDate(value).toLocaleString("it-IT", DATETIME_IT);
}

export function formatDurationIt(milliseconds: number): string {
	const totalMinutes = Math.floor(milliseconds / 60_000);
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;

	if (hours === 0) return `${minutes} min`;
	if (minutes === 0) return `${hours} h`;
	return `${hours} h ${minutes} min`;
}

export function formatEur(amount: number | string | { toString(): string }): string {
	return new Intl.NumberFormat("it-IT", {
		style: "currency",
		currency: "EUR",
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	}).format(Number(amount));
}
