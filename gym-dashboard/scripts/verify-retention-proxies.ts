/**
 * Smoke checks for fidelizzazione proxy (ticket 13).
 * Pure logic — no DB. Run: npx tsx scripts/verify-retention-proxies.ts
 */
import { differenceInCalendarDays } from "date-fns";
import {
	countRenewalsInPeriod,
	isPurchaseRelevantAt,
	listAtRiskClients,
	pickRelevantTitleKind,
	type PurchaseForTitleRelevance
} from "../src/lib/retention-proxies";

function assert(cond: unknown, message: string): asserts cond {
	if (!cond) throw new Error(message);
}

const day = (iso: string) => new Date(iso);

// --- title relevance uses snapshots, not live product ---
{
	const at = day("2026-07-15T12:00:00.000Z");
	const membership: PurchaseForTitleRelevance = {
		id: 1,
		date: day("2026-07-01T00:00:00.000Z"),
		membershipDuration: 30,
		entranceNumber: null,
		usedEntrances: 0
	};
	assert(isPurchaseRelevantAt(membership, at), "membership within snapshot duration");

	const expired: PurchaseForTitleRelevance = {
		...membership,
		membershipDuration: 10
	};
	assert(!isPurchaseRelevantAt(expired, at), "expired membership not relevant");

	const pack: PurchaseForTitleRelevance = {
		id: 2,
		date: day("2026-01-01T00:00:00.000Z"),
		membershipDuration: null,
		entranceNumber: 5,
		usedEntrances: 2
	};
	assert(isPurchaseRelevantAt(pack, at), "package with residual relevant");

	const exhausted: PurchaseForTitleRelevance = {
		...pack,
		usedEntrances: 5
	};
	assert(!isPurchaseRelevantAt(exhausted, at), "exhausted package not relevant");
}

// --- renewals: prior history or 2nd+ in period ---
{
	const period = [
		{ id: 1, clientId: 10, date: day("2026-07-02T00:00:00.000Z") },
		{ id: 2, clientId: 10, date: day("2026-07-10T00:00:00.000Z") },
		{ id: 3, clientId: 20, date: day("2026-07-05T00:00:00.000Z") },
		{ id: 4, clientId: 30, date: day("2026-07-08T00:00:00.000Z") }
	];
	const prior = new Set([30]);
	const result = countRenewalsInPeriod(period, prior);
	// id2 (2nd of 10), id4 (30 had prior) → 2 renewals, 2 clients
	assert(result.renewalsCount === 2, "two renewals expected");
	assert(result.renewingClientsCount === 2, "two renewing clients");
}

// --- at-risk: relevant title + stale / never ---
{
	const asOf = day("2026-07-22T12:00:00.000Z");
	const staleEntrance = day("2026-07-01T12:00:00.000Z");
	const purchases: PurchaseForTitleRelevance[] = [
		{
			id: 1,
			date: day("2026-07-01T00:00:00.000Z"),
			membershipDuration: 60,
			entranceNumber: null,
			usedEntrances: 0
		}
	];

	const expectedStaleDays = differenceInCalendarDays(asOf, staleEntrance);

	const atRisk = listAtRiskClients(
		[
			{
				clientId: 1,
				purchases,
				lastEntranceAt: staleEntrance
			},
			{
				clientId: 2,
				purchases,
				lastEntranceAt: day("2026-07-20T12:00:00.000Z")
			},
			{
				clientId: 3,
				purchases,
				lastEntranceAt: null
			},
			{
				clientId: 4,
				purchases: [
					{
						id: 9,
						date: day("2026-01-01T00:00:00.000Z"),
						membershipDuration: 30,
						entranceNumber: null,
						usedEntrances: 0
					}
				],
				lastEntranceAt: null
			}
		],
		asOf,
		14
	);

	assert(
		atRisk.map((r) => r.clientId).join(",") === "3,1",
		"never-entered first, then stale; exclude recent and expired-title"
	);
	assert(atRisk[0]?.daysSinceLastEntrance == null, "never entered → null days");
	assert(
		atRisk[1]?.daysSinceLastEntrance === expectedStaleDays,
		`stale days should be ${expectedStaleDays}`
	);
	assert(expectedStaleDays >= 14, "fixture must be beyond 14-day threshold");
	assert(pickRelevantTitleKind(purchases, asOf) === "Abbonamento", "title kind Abbonamento");
}

console.log("verify-retention-proxies: ok");
