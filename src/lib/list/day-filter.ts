import { endOfDay, format, startOfDay } from "date-fns";

const DAY_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Giorno di calendario locale da stringa filtro `yyyy-MM-dd`. */
export function parseFilterDay(raw: unknown): Date | undefined {
	if (typeof raw !== "string") return undefined;
	const match = DAY_RE.exec(raw.trim());
	if (!match) return undefined;
	const year = Number(match[1]);
	const month = Number(match[2]);
	const day = Number(match[3]);
	const date = new Date(year, month - 1, day);
	if (
		date.getFullYear() !== year ||
		date.getMonth() !== month - 1 ||
		date.getDate() !== day
	) {
		return undefined;
	}
	return date;
}

export function formatFilterDay(date: Date): string {
	return format(date, "yyyy-MM-dd");
}

/** Intervallo inclusivo [inizio, fine] del giorno locale. */
export function filterDayRange(
	raw: unknown
): { gte: Date; lte: Date } | undefined {
	const day = parseFilterDay(raw);
	if (!day) return undefined;
	return { gte: startOfDay(day), lte: endOfDay(day) };
}
