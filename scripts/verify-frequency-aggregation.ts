/**
 * Smoke: aggregati frequenza Ingressi + volume bancone giornaliero (ticket 53).
 * Esegui: npx tsx scripts/verify-frequency-aggregation.ts
 */
import assert from "node:assert/strict";
import {
	aggregateBanconeDaily,
	aggregateByHour,
	aggregateByMonthOfYear,
	aggregateByWeekday,
	computeEntranceFrequency,
} from "../src/lib/frequency-aggregation";

function d(iso: string) {
	return new Date(iso);
}

// Ora: tre eventi → bucket 10 e 18.
{
	const points = aggregateByHour([
		d("2024-03-15T10:15:00"),
		d("2024-03-15T10:45:00"),
		d("2024-03-16T18:00:00"),
	]);
	assert.equal(points.length, 24);
	assert.equal(points[10]?.count, 2);
	assert.equal(points[18]?.count, 1);
	assert.equal(points[0]?.count, 0);
	assert.equal(points[10]?.label, "10:00");
}

// Weekday ISO: venerdì 2024-03-15, sabato 2024-03-16.
{
	const points = aggregateByWeekday([
		d("2024-03-15T10:00:00"),
		d("2024-03-16T10:00:00"),
		d("2024-03-16T12:00:00"),
	]);
	assert.equal(points.length, 7);
	assert.equal(points[4]?.label, "Venerdì");
	assert.equal(points[4]?.count, 1);
	assert.equal(points[5]?.label, "Sabato");
	assert.equal(points[5]?.count, 2);
	assert.equal(points[0]?.count, 0);
}

// Mese-dell'anno: marzo e aprile.
{
	const points = aggregateByMonthOfYear([
		d("2024-03-01T08:00:00"),
		d("2023-03-20T08:00:00"),
		d("2024-04-01T08:00:00"),
	]);
	assert.equal(points.length, 12);
	assert.equal(points[2]?.label, "Marzo");
	assert.equal(points[2]?.count, 2);
	assert.equal(points[3]?.count, 1);
	assert.equal(points[0]?.count, 0);
}

// Bancone giornaliero: Ingressi + Vendite allineati, zeri inclusi.
{
	const daily = aggregateBanconeDaily(
		[d("2024-01-01T09:00:00"), d("2024-01-01T11:00:00"), d("2024-01-03T09:00:00")],
		[d("2024-01-01T10:00:00"), d("2024-01-02T10:00:00")],
		d("2024-01-01"),
		d("2024-01-03")
	);
	assert.equal(daily.length, 3);
	assert.equal(daily[0]?.ingressi, 2);
	assert.equal(daily[0]?.vendite, 1);
	assert.equal(daily[1]?.ingressi, 0);
	assert.equal(daily[1]?.vendite, 1);
	assert.equal(daily[2]?.ingressi, 1);
	assert.equal(daily[2]?.vendite, 0);
}

{
	const freq = computeEntranceFrequency([d("2024-06-03T14:00:00")]); // lunedì
	assert.equal(freq.byHour[14]?.count, 1);
	assert.equal(freq.byWeekday[0]?.count, 1);
	assert.equal(freq.byMonth[5]?.count, 1);
}

console.log("verify-frequency-aggregation: ok");
