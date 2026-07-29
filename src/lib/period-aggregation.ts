/**
 * Granularità di periodo per serie temporali (Entrate/Ingressi/…).
 * Non confondere con le dimensioni di frequenza (ora / weekday / mese-dell'anno).
 */
import {
	addDays,
	addMonths,
	addWeeks,
	addYears,
	eachDayOfInterval,
	eachMonthOfInterval,
	eachWeekOfInterval,
	eachYearOfInterval,
	endOfDay,
	endOfISOWeek,
	endOfMonth,
	endOfYear,
	format,
	startOfDay,
	startOfISOWeek,
	startOfMonth,
	startOfYear,
} from "date-fns";
import { it } from "date-fns/locale";

export const PERIOD_TYPES = ["daily", "weekly", "monthly", "yearly"] as const;
export type PeriodType = (typeof PERIOD_TYPES)[number];

export const PERIOD_TYPE_LABELS: Record<PeriodType, string> = {
	daily: "Giornaliero",
	weekly: "Settimanale",
	monthly: "Mensile",
	yearly: "Annuale",
};

export type PeriodBucketMeta = {
	/** Chiave stabile per join/chart (es. 2024-03-15, 2024-W11, 2024-03, 2024). */
	key: string;
	label: string;
	start: Date;
	end: Date;
};

export type PeriodRange = {
	from: Date;
	to: Date;
};

/** Intervallo inclusivo sul calendario locale (inizio giorno → fine giorno). */
export function normalizeInclusiveRange(from: Date, to: Date): PeriodRange {
	const start = startOfDay(from);
	const end = endOfDay(to);
	if (start.getTime() > end.getTime()) {
		return { from: startOfDay(to), to: endOfDay(from) };
	}
	return { from: start, to: end };
}

function dailyKey(d: Date): string {
	return format(d, "yyyy-MM-dd");
}

function weeklyKey(d: Date): string {
	return format(startOfISOWeek(d), "RRRR-'W'II");
}

function monthlyKey(d: Date): string {
	return format(d, "yyyy-MM");
}

function yearlyKey(d: Date): string {
	return format(d, "yyyy");
}

export function periodKeyForDate(date: Date, periodType: PeriodType): string {
	switch (periodType) {
		case "daily":
			return dailyKey(date);
		case "weekly":
			return weeklyKey(date);
		case "monthly":
			return monthlyKey(date);
		case "yearly":
			return yearlyKey(date);
	}
}

function labelForBucket(start: Date, periodType: PeriodType): string {
	switch (periodType) {
		case "daily":
			return format(start, "d MMM yyyy", { locale: it });
		case "weekly": {
			const weekEnd = endOfISOWeek(start);
			return `${format(start, "d MMM", { locale: it })} – ${format(weekEnd, "d MMM yyyy", { locale: it })}`;
		}
		case "monthly":
			return format(start, "MMM yyyy", { locale: it });
		case "yearly":
			return format(start, "yyyy");
	}
}

/** Elenco continuo di bucket che coprono [from, to] alla granularità scelta (zeri inclusi). */
export function buildPeriodBuckets(from: Date, to: Date, periodType: PeriodType): PeriodBucketMeta[] {
	const range = normalizeInclusiveRange(from, to);
	switch (periodType) {
		case "daily":
			return eachDayOfInterval({ start: range.from, end: range.to }).map((day) => ({
				key: dailyKey(day),
				label: labelForBucket(day, "daily"),
				start: startOfDay(day),
				end: endOfDay(day),
			}));
		case "weekly": {
			const weeks = eachWeekOfInterval(
				{ start: range.from, end: range.to },
				{ weekStartsOn: 1 }
			);
			return weeks.map((weekStart) => {
				const start = startOfISOWeek(weekStart);
				return {
					key: weeklyKey(start),
					label: labelForBucket(start, "weekly"),
					start,
					end: endOfISOWeek(start),
				};
			});
		}
		case "monthly":
			return eachMonthOfInterval({ start: range.from, end: range.to }).map((monthStart) => {
				const start = startOfMonth(monthStart);
				return {
					key: monthlyKey(start),
					label: labelForBucket(start, "monthly"),
					start,
					end: endOfMonth(start),
				};
			});
		case "yearly":
			return eachYearOfInterval({ start: range.from, end: range.to }).map((yearStart) => {
				const start = startOfYear(yearStart);
				return {
					key: yearlyKey(start),
					label: labelForBucket(start, "yearly"),
					start,
					end: endOfYear(start),
				};
			});
	}
}

export type PeriodPoint = {
	key: string;
	label: string;
	/** Valore aggregato (conteggio, importo, …). */
	value: number;
};

/**
 * Aggrega eventi datati in una serie continua alla granularità scelta.
 * `valueOf` estrae il contributo numerico di ogni evento (default: 1).
 */
export function aggregateByPeriod<T>(
	events: T[],
	getDate: (event: T) => Date,
	from: Date,
	to: Date,
	periodType: PeriodType,
	valueOf: (event: T) => number = () => 1
): PeriodPoint[] {
	const buckets = buildPeriodBuckets(from, to, periodType);
	const totals = new Map<string, number>(buckets.map((b) => [b.key, 0]));
	const range = normalizeInclusiveRange(from, to);

	for (const event of events) {
		const date = getDate(event);
		if (date.getTime() < range.from.getTime() || date.getTime() > range.to.getTime()) {
			continue;
		}
		const key = periodKeyForDate(date, periodType);
		totals.set(key, (totals.get(key) ?? 0) + valueOf(event));
	}

	return buckets.map((bucket) => ({
		key: bucket.key,
		label: bucket.label,
		value: totals.get(bucket.key) ?? 0,
	}));
}

/** Smoke: un bucket in più quando l’intervallo attraversa il confine di granularità. */
export function periodBucketCount(from: Date, to: Date, periodType: PeriodType): number {
	return buildPeriodBuckets(from, to, periodType).length;
}

/** Usato nei verify script: avanza di un passo di granularità. */
export function addPeriodStep(date: Date, periodType: PeriodType, steps = 1): Date {
	switch (periodType) {
		case "daily":
			return addDays(date, steps);
		case "weekly":
			return addWeeks(date, steps);
		case "monthly":
			return addMonths(date, steps);
		case "yearly":
			return addYears(date, steps);
	}
}
