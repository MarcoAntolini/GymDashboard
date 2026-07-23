/**
 * Pure-logic cases for frequenza Ingressi / carico bancone (ticket 12).
 * Run: npx tsx scripts/verify-overview-frequency.ts
 */
import {
	buildDeskDays,
	fillHourBuckets,
	fillMonthBuckets,
	fillWeekdayBuckets,
	peakBucket,
	peakDeskDay
} from "../src/lib/overview-frequency";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

// --- hour buckets: sparse → 24 slots ---
{
	const buckets = fillHourBuckets([
		{ bucket: 8, count: 3 },
		{ bucket: 18, count: 12 },
		{ bucket: 18, count: 12 } // last write wins via Map — caller shouldn't duplicate
	]);
	assert(buckets.length === 24, "24 hour slots");
	assert(buckets[0].label === "00:00", "midnight label");
	assert(buckets[8].count === 3, "08:00 count");
	assert(buckets[18].count === 12, "18:00 count");
	assert(buckets[12].count === 0, "missing hour zero");
	const peak = peakBucket(buckets);
	assert(peak?.key === 18 && peak.count === 12, "hour peak at 18");
}

// --- weekday: MySQL WEEKDAY 0=Mon ---
{
	const buckets = fillWeekdayBuckets([
		{ bucket: 0, count: 5 },
		{ bucket: 5, count: 20 }
	]);
	assert(buckets.length === 7, "7 weekdays");
	assert(buckets[0].label === "Lun", "Monday first");
	assert(buckets[6].label === "Dom", "Sunday last");
	assert(peakBucket(buckets)?.label === "Sab", "Saturday peak");
}

// --- month 1–12 ---
{
	const buckets = fillMonthBuckets([{ bucket: 7, count: 40 }]);
	assert(buckets.length === 12, "12 months");
	assert(buckets[6].label === "Lug" && buckets[6].count === 40, "July");
	assert(peakBucket(buckets)?.key === 7, "July peak");
}

// --- peak ties → lowest key ---
{
	const peak = peakBucket([
		{ key: 3, label: "c", count: 10 },
		{ key: 1, label: "a", count: 10 },
		{ key: 2, label: "b", count: 9 }
	]);
	assert(peak?.key === 1, "tie breaks to lowest key");
}

// --- peak ignores zeros ---
{
	assert(peakBucket(fillHourBuckets([])) === null, "all-zero → null peak");
}

// --- desk load merge ---
{
	const days = buildDeskDays(
		["2026-07-01", "2026-07-02", "2026-07-03"],
		new Map([
			["2026-07-01", 4],
			["2026-07-03", 1]
		]),
		new Map([["2026-07-01", 2], ["2026-07-02", 5]]),
		(key) => key.slice(5)
	);
	assert(days[0].entrances === 4 && days[0].purchases === 2 && days[0].total === 6, "day1");
	assert(days[1].entrances === 0 && days[1].purchases === 5 && days[1].total === 5, "day2");
	assert(days[2].total === 1, "day3 entrances only");
	const peak = peakDeskDay(days);
	assert(peak?.date === "2026-07-01" && peak.total === 6, "desk peak day1");
}

// --- desk peak ties → earliest date ---
{
	const days = buildDeskDays(
		["2026-07-01", "2026-07-02"],
		new Map([
			["2026-07-01", 3],
			["2026-07-02", 3]
		]),
		new Map(),
		(k) => k
	);
	assert(peakDeskDay(days)?.date === "2026-07-01", "desk tie → earliest");
}

console.log("verify-overview-frequency: ok");
