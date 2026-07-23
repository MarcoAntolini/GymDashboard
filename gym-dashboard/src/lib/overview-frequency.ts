/**
 * Pure helpers for frequenza Ingressi / carico bancone (ticket 12).
 * Buckets are calendar dimensions (ora, weekday, mese), not time-series granularity.
 */

export type FreqBucket = {
	key: number;
	label: string;
	count: number;
};

export type DeskDay = {
	/** yyyy-MM-dd */
	date: string;
	label: string;
	entrances: number;
	purchases: number;
	total: number;
};

const WEEKDAY_LABELS_IT = [
	"Lun",
	"Mar",
	"Mer",
	"Gio",
	"Ven",
	"Sab",
	"Dom"
] as const;

const MONTH_LABELS_IT = [
	"Gen",
	"Feb",
	"Mar",
	"Apr",
	"Mag",
	"Giu",
	"Lug",
	"Ago",
	"Set",
	"Ott",
	"Nov",
	"Dic"
] as const;

export function hourLabel(hour: number): string {
	return `${String(hour).padStart(2, "0")}:00`;
}

export function weekdayLabel(weekday: number): string {
	return WEEKDAY_LABELS_IT[weekday] ?? String(weekday);
}

export function monthLabel(month: number): string {
	return MONTH_LABELS_IT[month - 1] ?? String(month);
}

/** Fill 0–23 with counts from sparse DB rows (MySQL HOUR). */
export function fillHourBuckets(
	rows: Array<{ bucket: number; count: number }>
): FreqBucket[] {
	const map = new Map(rows.map((r) => [r.bucket, r.count]));
	return Array.from({ length: 24 }, (_, hour) => ({
		key: hour,
		label: hourLabel(hour),
		count: map.get(hour) ?? 0
	}));
}

/**
 * Fill Mon–Sun (keys 0–6) from MySQL WEEKDAY() (0=Monday … 6=Sunday).
 */
export function fillWeekdayBuckets(
	rows: Array<{ bucket: number; count: number }>
): FreqBucket[] {
	const map = new Map(rows.map((r) => [r.bucket, r.count]));
	return Array.from({ length: 7 }, (_, weekday) => ({
		key: weekday,
		label: weekdayLabel(weekday),
		count: map.get(weekday) ?? 0
	}));
}

/** Fill months 1–12 from MySQL MONTH(). */
export function fillMonthBuckets(
	rows: Array<{ bucket: number; count: number }>
): FreqBucket[] {
	const map = new Map(rows.map((r) => [r.bucket, r.count]));
	return Array.from({ length: 12 }, (_, i) => {
		const month = i + 1;
		return {
			key: month,
			label: monthLabel(month),
			count: map.get(month) ?? 0
		};
	});
}

/** Peak = max count; ties → lowest key (first in calendar order). */
export function peakBucket(buckets: FreqBucket[]): FreqBucket | null {
	if (buckets.length === 0) return null;
	let best: FreqBucket | null = null;
	for (const bucket of buckets) {
		if (bucket.count <= 0) continue;
		if (
			best == null ||
			bucket.count > best.count ||
			(bucket.count === best.count && bucket.key < best.key)
		) {
			best = bucket;
		}
	}
	return best;
}

/**
 * Merge daily Ingressi / Acquisti maps into a continuous day range (inclusive).
 * `days` are yyyy-MM-dd keys in chronological order.
 */
export function buildDeskDays(
	days: string[],
	entrancesByDay: Map<string, number>,
	purchasesByDay: Map<string, number>,
	labelForDay: (yyyyMmDd: string) => string
): DeskDay[] {
	return days.map((date) => {
		const entrances = entrancesByDay.get(date) ?? 0;
		const purchases = purchasesByDay.get(date) ?? 0;
		return {
			date,
			label: labelForDay(date),
			entrances,
			purchases,
			total: entrances + purchases
		};
	});
}

/** Peak desk day by total Ingressi+Acquisti; ties → earliest date. */
export function peakDeskDay(days: DeskDay[]): DeskDay | null {
	let best: DeskDay | null = null;
	for (const day of days) {
		if (day.total <= 0) continue;
		if (
			best == null ||
			day.total > best.total ||
			(day.total === best.total && day.date < best.date)
		) {
			best = day;
		}
	}
	return best;
}
