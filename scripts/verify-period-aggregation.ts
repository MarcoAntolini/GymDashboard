/**
 * Smoke verify: granularità periodo produce bucket coerenti (ticket 50).
 * Esegui: node --import tsx scripts/verify-period-aggregation.ts
 * oppure via npx tsx se disponibile.
 */
import assert from "node:assert/strict";
import {
	aggregateByPeriod,
	buildPeriodBuckets,
	normalizeInclusiveRange,
	periodKeyForDate,
	type PeriodType,
} from "../src/lib/period-aggregation";

function d(iso: string) {
	return new Date(iso);
}

// Range inclusivo: stesso giorno calendario non è vuoto.
{
	const range = normalizeInclusiveRange(d("2024-03-15T00:00:00"), d("2024-03-15T00:00:00"));
	assert.equal(range.from.getHours(), 0);
	assert.ok(range.to.getHours() >= 23 || range.to.getTime() > range.from.getTime());
}

// Giornaliero: 3 giorni → 3 bucket.
{
	const buckets = buildPeriodBuckets(d("2024-01-01"), d("2024-01-03"), "daily");
	assert.equal(buckets.length, 3);
	assert.equal(buckets[0].key, "2024-01-01");
	assert.equal(buckets[2].key, "2024-01-03");
}

// Mensile: gen–mar → 3 bucket.
{
	const buckets = buildPeriodBuckets(d("2024-01-15"), d("2024-03-10"), "monthly");
	assert.equal(buckets.length, 3);
	assert.deepEqual(
		buckets.map((b) => b.key),
		["2024-01", "2024-02", "2024-03"]
	);
}

// Annuale: 2023–2025 → 3 bucket.
{
	const buckets = buildPeriodBuckets(d("2023-06-01"), d("2025-02-01"), "yearly");
	assert.equal(buckets.length, 3);
	assert.deepEqual(
		buckets.map((b) => b.key),
		["2023", "2024", "2025"]
	);
}

// Aggregazione: importi per mese.
{
	const events = [
		{ date: d("2024-01-05T10:00:00"), amount: 100 },
		{ date: d("2024-01-20T10:00:00"), amount: 50 },
		{ date: d("2024-02-01T10:00:00"), amount: 25 },
	];
	const points = aggregateByPeriod(
		events,
		(e) => e.date,
		d("2024-01-01"),
		d("2024-02-28"),
		"monthly",
		(e) => e.amount
	);
	assert.equal(points.length, 2);
	assert.equal(points[0].value, 150);
	assert.equal(points[1].value, 25);
}

// Cambio tipo periodo → chiavi diverse sullo stesso evento.
{
	const at = d("2024-03-15T12:00:00");
	const keys: Record<PeriodType, string> = {
		daily: periodKeyForDate(at, "daily"),
		weekly: periodKeyForDate(at, "weekly"),
		monthly: periodKeyForDate(at, "monthly"),
		yearly: periodKeyForDate(at, "yearly"),
	};
	assert.equal(keys.daily, "2024-03-15");
	assert.equal(keys.monthly, "2024-03");
	assert.equal(keys.yearly, "2024");
	assert.match(keys.weekly, /^2024-W\d{2}$/);
}

console.log("verify-period-aggregation: ok");
