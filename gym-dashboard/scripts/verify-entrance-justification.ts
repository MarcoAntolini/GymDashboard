/**
 * Sequential cases for Ingresso tie-break (ticket 05).
 * Run: npx tsx scripts/verify-entrance-justification.ts
 */
import {
	isMembershipValidAt,
	selectJustifyingPurchaseId,
	type PurchaseForJustification
} from "../src/lib/entrance-justification";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

const day = (iso: string) => new Date(iso);

// --- membership preferred over package with residuo ---
{
	const at = day("2026-07-15T12:00:00.000Z");
	const purchases: PurchaseForJustification[] = [
		{
			id: 1,
			date: day("2026-01-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 10,
			usedEntrances: 0
		},
		{
			id: 2,
			date: day("2026-07-01T00:00:00.000Z"),
			membershipDuration: 30,
			entranceNumber: null,
			usedEntrances: 0
		}
	];
	assert(selectJustifyingPurchaseId(purchases, at) === 2, "membership preferred over package");
}

// --- among memberships: max (date, id) ---
{
	const at = day("2026-07-15T12:00:00.000Z");
	const purchases: PurchaseForJustification[] = [
		{
			id: 10,
			date: day("2026-07-01T00:00:00.000Z"),
			membershipDuration: 30,
			entranceNumber: null,
			usedEntrances: 0
		},
		{
			id: 11,
			date: day("2026-07-10T00:00:00.000Z"),
			membershipDuration: 30,
			entranceNumber: null,
			usedEntrances: 0
		},
		{
			id: 12,
			date: day("2026-07-10T00:00:00.000Z"),
			membershipDuration: 30,
			entranceNumber: null,
			usedEntrances: 0
		}
	];
	assert(selectJustifyingPurchaseId(purchases, at) === 12, "membership max (date, id)");
}

// --- expired membership ignored; FIFO package ---
{
	const at = day("2026-08-15T12:00:00.000Z");
	const purchases: PurchaseForJustification[] = [
		{
			id: 1,
			date: day("2026-07-01T00:00:00.000Z"),
			membershipDuration: 30, // [Jul 1, Jul 31) — expired
			entranceNumber: null,
			usedEntrances: 0
		},
		{
			id: 20,
			date: day("2026-06-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 5,
			usedEntrances: 5 // residuo 0
		},
		{
			id: 21,
			date: day("2026-05-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 5,
			usedEntrances: 0
		},
		{
			id: 22,
			date: day("2026-06-15T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 5,
			usedEntrances: 1
		}
	];
	// FIFO: oldest with residuo > 0 → id 21 (May 1)
	assert(selectJustifyingPurchaseId(purchases, at) === 21, "FIFO package min (date, id)");
}

// --- reject at residual 0 / no candidate ---
{
	const at = day("2026-08-15T12:00:00.000Z");
	const purchases: PurchaseForJustification[] = [
		{
			id: 1,
			date: day("2026-07-01T00:00:00.000Z"),
			membershipDuration: 30,
			entranceNumber: null,
			usedEntrances: 0
		},
		{
			id: 2,
			date: day("2026-01-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 3,
			usedEntrances: 3
		}
	];
	assert(selectJustifyingPurchaseId(purchases, at) === null, "reject when no candidate");
}

// --- half-open membership window ---
{
	const start = day("2026-07-01T00:00:00.000Z");
	assert(isMembershipValidAt(start, 30, start), "valid at start inclusive");
	assert(
		!isMembershipValidAt(start, 30, day("2026-07-31T00:00:00.000Z")),
		"invalid at end exclusive (t0+30d)"
	);
	assert(
		isMembershipValidAt(start, 30, day("2026-07-30T23:59:59.000Z")),
		"valid just before end"
	);
}

// --- package tie on same date: min id ---
{
	const at = day("2026-07-15T12:00:00.000Z");
	const purchases: PurchaseForJustification[] = [
		{
			id: 50,
			date: day("2026-06-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 2,
			usedEntrances: 0
		},
		{
			id: 40,
			date: day("2026-06-01T00:00:00.000Z"),
			membershipDuration: null,
			entranceNumber: 2,
			usedEntrances: 0
		}
	];
	assert(selectJustifyingPurchaseId(purchases, at) === 40, "FIFO same date → min id");
}

console.log("verify-entrance-justification: all cases passed");
