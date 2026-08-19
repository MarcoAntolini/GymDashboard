/**
 * Smoke: preset periodo Panoramica + GET / autenticata.
 * Esegui: npx tsx scripts/verify-overview-home.ts
 */
import assert from "node:assert/strict";
import { startOfMonth, subDays } from "date-fns";
import { db } from "../src/lib/db";
import {
	OVERVIEW_PERIOD_LABELS,
	overviewPeriodCaption,
	rangeForOverviewPreset,
} from "../src/lib/overview-period";
import { createSessionValue, getSessionCookieName, signSessionValue } from "../src/lib/session";

async function main() {
	const now = new Date("2026-07-29T15:00:00");
	const month = rangeForOverviewPreset("current_month", now);
	assert.equal(month.from.getTime(), startOfMonth(now).getTime());
	assert.ok(month.to.getTime() >= now.getTime());

	const last30 = rangeForOverviewPreset("last_30_days", now);
	assert.equal(last30.from.getFullYear(), subDays(now, 29).getFullYear());
	assert.equal(last30.from.getMonth(), subDays(now, 29).getMonth());
	assert.equal(last30.from.getDate(), subDays(now, 29).getDate());
	assert.ok(OVERVIEW_PERIOD_LABELS.current_month.includes("Mese"));
	assert.ok(overviewPeriodCaption("current_month", month.from, month.to).includes("Mese corrente"));

	const { payloadB64 } = createSessionValue("owner", "Owner");
	const cookie = await signSessionValue(payloadB64);
	const res = await fetch("http://localhost:3000/", {
		headers: { Cookie: `${getSessionCookieName()}=${cookie}` },
		redirect: "manual",
	});
	console.log("GET / status", res.status, "location", res.headers.get("location"));
	assert.equal(res.status, 200, "authenticated / should not redirect");
	const html = await res.text();
	assert.ok(html.includes("Panoramica"), "HTML should include Panoramica");
	console.log("page bytes", html.length);

	const live = rangeForOverviewPreset("current_month", new Date());
	const [pCount, payCount, eCount] = await Promise.all([
		db.sale.count({ where: { date: { gte: live.from, lte: live.to } } }),
		db.payment.count({ where: { date: { gte: live.from, lte: live.to } } }),
		db.entrance.count({ where: { date: { gte: live.from, lte: live.to } } }),
	]);
	console.log("period counts sales/payments/entrances", pCount, payCount, eCount);
	await db.$disconnect();
	console.log("verify-overview-home: ok");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
