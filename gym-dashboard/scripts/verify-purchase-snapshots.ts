/**
 * Pure-logic cases for snapshot durata / N su Acquisto (ticket 01).
 * Run: npx tsx scripts/verify-purchase-snapshots.ts
 */
import { purchaseSnapshotsFromProduct } from "../src/lib/purchase-snapshots";
import {
	isMembershipValidAt,
	packageResidual,
	selectJustifyingPurchaseId,
	type PurchaseForJustification
} from "../src/lib/entrance-justification";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

function assertThrows(fn: () => unknown, includes: string, msg: string) {
	try {
		fn();
		throw new Error(`${msg}: expected throw`);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		assert(message.includes(includes), `${msg}: unexpected error: ${message}`);
	}
}

// --- membership → duration snapshot only ---
{
	const snap = purchaseSnapshotsFromProduct({
		membership: { duration: 30 },
		entranceSet: null
	});
	assert(snap.membershipDuration === 30, "membership duration copied");
	assert(snap.entranceNumber === null, "membership has null N");
}

// --- package → N snapshot only ---
{
	const snap = purchaseSnapshotsFromProduct({
		membership: null,
		entranceSet: { entranceNumber: 10 }
	});
	assert(snap.membershipDuration === null, "package has null duration");
	assert(snap.entranceNumber === 10, "package N copied");
}

// --- reject XOR / missing specialization ---
{
	assertThrows(
		() =>
			purchaseSnapshotsFromProduct({
				membership: { duration: 30 },
				entranceSet: { entranceNumber: 5 }
			}),
		"contemporaneamente",
		"reject dual specialization"
	);
	assertThrows(
		() =>
			purchaseSnapshotsFromProduct({
				membership: null,
				entranceSet: null
			}),
		"non specializzato",
		"reject bare product"
	);
}

// --- justification / residual use Purchase snapshots, not live Product ---
{
	const at = new Date("2026-07-15T12:00:00.000Z");
	// Sold as 10-day membership; live product later changed to 365 — snapshot still 10.
	const sold: PurchaseForJustification = {
		id: 1,
		date: new Date("2026-07-01T00:00:00.000Z"),
		membershipDuration: 10,
		entranceNumber: null,
		usedEntrances: 0
	};
	assert(
		!isMembershipValidAt(sold.date, sold.membershipDuration!, at),
		"expired under sold duration even if live product grew"
	);
	assert(selectJustifyingPurchaseId([sold], at) === null, "no justify with sold snapshot expired");

	const packageSold: PurchaseForJustification = {
		id: 2,
		date: new Date("2026-01-01T00:00:00.000Z"),
		membershipDuration: null,
		entranceNumber: 3, // sold N=3; live product later set to 100
		usedEntrances: 3
	};
	assert(packageResidual(packageSold.entranceNumber!, packageSold.usedEntrances) === 0, "residuo from sold N");
	assert(
		selectJustifyingPurchaseId([packageSold], at) === null,
		"exhausted sold N ignores live product N"
	);
}

console.log("verify-purchase-snapshots: all cases passed");
