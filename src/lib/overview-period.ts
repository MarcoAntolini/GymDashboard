/**
 * Preset periodo per la Panoramica home (non confondere con PeriodType chart).
 */
import { format, startOfMonth, subDays } from "date-fns";
import { it } from "date-fns/locale";
import { normalizeInclusiveRange, type PeriodRange } from "@/lib/period-aggregation";

export const OVERVIEW_PERIOD_PRESETS = ["current_month", "last_30_days"] as const;
export type OverviewPeriodPreset = (typeof OVERVIEW_PERIOD_PRESETS)[number];

export const OVERVIEW_PERIOD_LABELS: Record<OverviewPeriodPreset, string> = {
	current_month: "Mese corrente",
	last_30_days: "Ultimi 30 giorni",
};

/** Intervallo inclusivo locale: mese corrente fino a oggi, oppure ultimi 30 giorni. */
export function rangeForOverviewPreset(
	preset: OverviewPeriodPreset,
	now: Date = new Date()
): PeriodRange {
	if (preset === "current_month") {
		return normalizeInclusiveRange(startOfMonth(now), now);
	}
	return normalizeInclusiveRange(subDays(now, 29), now);
}

export function overviewPeriodCaption(
	preset: OverviewPeriodPreset,
	from: Date,
	to: Date
): string {
	const range = `${format(from, "d MMM", { locale: it })} – ${format(to, "d MMM yyyy", { locale: it })}`;
	return `${OVERVIEW_PERIOD_LABELS[preset]} (${range})`;
}

export function isOverviewPeriodPreset(value: unknown): value is OverviewPeriodPreset {
	return value === "current_month" || value === "last_30_days";
}
