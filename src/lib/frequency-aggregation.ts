/**
 * Dimensioni di frequenza (ora / weekday / mese-dell'anno) — separate da PeriodType
 * (serie temporale giornaliera/settimanale/…).
 */
import { getHours, getISODay, getMonth } from "date-fns";
import {
	aggregateByPeriod,
	normalizeInclusiveRange,
} from "@/lib/period-aggregation";

export type FrequencyPoint = {
	key: string;
	label: string;
	count: number;
};

export type BanconeDailyPoint = {
	key: string;
	label: string;
	ingressi: number;
	vendite: number;
};

const WEEKDAY_LABELS = [
	"Lunedì",
	"Martedì",
	"Mercoledì",
	"Giovedì",
	"Venerdì",
	"Sabato",
	"Domenica",
] as const;

const MONTH_LABELS = [
	"Gennaio",
	"Febbraio",
	"Marzo",
	"Aprile",
	"Maggio",
	"Giugno",
	"Luglio",
	"Agosto",
	"Settembre",
	"Ottobre",
	"Novembre",
	"Dicembre",
] as const;

function emptyHourBuckets(): FrequencyPoint[] {
	return Array.from({ length: 24 }, (_, hour) => ({
		key: String(hour),
		label: `${String(hour).padStart(2, "0")}:00`,
		count: 0,
	}));
}

function emptyWeekdayBuckets(): FrequencyPoint[] {
	return WEEKDAY_LABELS.map((label, index) => ({
		key: String(index + 1),
		label,
		count: 0,
	}));
}

function emptyMonthBuckets(): FrequencyPoint[] {
	return MONTH_LABELS.map((label, index) => ({
		key: String(index + 1),
		label,
		count: 0,
	}));
}

/** Conta Ingressi per ora del giorno (0–23), bucket fissi anche a zero. */
export function aggregateByHour(dates: Date[]): FrequencyPoint[] {
	const buckets = emptyHourBuckets();
	for (const date of dates) {
		const hour = getHours(date);
		const bucket = buckets[hour];
		if (bucket) bucket.count += 1;
	}
	return buckets;
}

/** Conta Ingressi per giorno ISO (1=Lun … 7=Dom). */
export function aggregateByWeekday(dates: Date[]): FrequencyPoint[] {
	const buckets = emptyWeekdayBuckets();
	for (const date of dates) {
		const isoDay = getISODay(date);
		const bucket = buckets[isoDay - 1];
		if (bucket) bucket.count += 1;
	}
	return buckets;
}

/** Conta Ingressi per mese dell'anno (1–12), indipendente dall'anno. */
export function aggregateByMonthOfYear(dates: Date[]): FrequencyPoint[] {
	const buckets = emptyMonthBuckets();
	for (const date of dates) {
		const monthIndex = getMonth(date);
		const bucket = buckets[monthIndex];
		if (bucket) bucket.count += 1;
	}
	return buckets;
}

/**
 * Volume operativo giornaliero: Ingressi e Vendite nello stesso intervallo
 * (serie continua con zeri).
 */
export function aggregateBanconeDaily(
	entranceDates: Date[],
	saleDates: Date[],
	from: Date,
	to: Date
): BanconeDailyPoint[] {
	const range = normalizeInclusiveRange(from, to);
	const ingressiSeries = aggregateByPeriod(
		entranceDates.map((date) => ({ date })),
		(e) => e.date,
		range.from,
		range.to,
		"daily"
	);
	const venditeSeries = aggregateByPeriod(
		saleDates.map((date) => ({ date })),
		(e) => e.date,
		range.from,
		range.to,
		"daily"
	);
	const venditeByKey = new Map(venditeSeries.map((p) => [p.key, p.value]));
	return ingressiSeries.map((point) => ({
		key: point.key,
		label: point.label,
		ingressi: point.value,
		vendite: venditeByKey.get(point.key) ?? 0,
	}));
}

export type EntranceFrequency = {
	byHour: FrequencyPoint[];
	byWeekday: FrequencyPoint[];
	byMonth: FrequencyPoint[];
};

export function computeEntranceFrequency(dates: Date[]): EntranceFrequency {
	return {
		byHour: aggregateByHour(dates),
		byWeekday: aggregateByWeekday(dates),
		byMonth: aggregateByMonthOfYear(dates),
	};
}
