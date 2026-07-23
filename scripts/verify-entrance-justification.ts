/**
 * Sequential domain cases for Ingresso justification (no DB).
 * Run: npx tsx scripts/verify-entrance-justification.ts
 */
import assert from "node:assert/strict";
import {
	selectJustifyingPurchaseId,
	type PurchaseCandidate,
} from "../src/lib/domain/entrance-justification";

const at = new Date("2026-03-15T12:00:00.000Z");

function c(
	partial: Partial<PurchaseCandidate> & Pick<PurchaseCandidate, "id" | "date">
): PurchaseCandidate {
	return {
		duration: null,
		entranceNumber: null,
		usedEntranceCount: 0,
		...partial,
	};
}

function run() {
	// membership preferred over pack
	assert.equal(
		selectJustifyingPurchaseId(
			[
				c({ id: 1, date: new Date("2026-03-01T08:00:00.000Z"), entranceNumber: 10 }),
				c({ id: 2, date: new Date("2026-03-10T08:00:00.000Z"), duration: 30 }),
			],
			at
		),
		2
	);

	// max membership (date, id)
	assert.equal(
		selectJustifyingPurchaseId(
			[
				c({ id: 10, date: new Date("2026-03-01T08:00:00.000Z"), duration: 60 }),
				c({ id: 20, date: new Date("2026-03-10T08:00:00.000Z"), duration: 30 }),
				c({ id: 30, date: new Date("2026-03-10T08:00:00.000Z"), duration: 30 }),
			],
			at
		),
		30
	);

	// FIFO pack min (date, id)
	assert.equal(
		selectJustifyingPurchaseId(
			[
				c({
					id: 8,
					date: new Date("2026-02-01T08:00:00.000Z"),
					entranceNumber: 3,
					usedEntranceCount: 1,
				}),
				c({
					id: 9,
					date: new Date("2026-02-01T08:00:00.000Z"),
					entranceNumber: 3,
					usedEntranceCount: 0,
				}),
				c({
					id: 7,
					date: new Date("2026-03-05T08:00:00.000Z"),
					entranceNumber: 2,
					usedEntranceCount: 0,
				}),
			],
			at
		),
		8
	);

	// reject residuo 0
	assert.equal(
		selectJustifyingPurchaseId(
			[
				c({
					id: 2,
					date: new Date("2026-03-01T08:00:00.000Z"),
					entranceNumber: 2,
					usedEntranceCount: 2,
				}),
			],
			at
		),
		null
	);

	// half-open window
	const soldAt = new Date("2026-03-01T10:00:00.000Z");
	assert.equal(
		selectJustifyingPurchaseId(
			[c({ id: 1, date: soldAt, duration: 14 })],
			new Date("2026-03-15T09:59:59.000Z")
		),
		1
	);
	assert.equal(
		selectJustifyingPurchaseId(
			[c({ id: 1, date: soldAt, duration: 14 })],
			new Date("2026-03-15T10:00:00.000Z")
		),
		null
	);

	console.log("verify-entrance-justification: all cases OK");
}

run();
