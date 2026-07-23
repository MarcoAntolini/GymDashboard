import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	NO_JUSTIFYING_PURCHASE_ERROR,
	selectJustifyingPurchaseId,
	type PurchaseCandidate,
} from "./entrance-justification.ts";

const at = new Date("2026-03-15T12:00:00.000Z");

function candidate(
	partial: Partial<PurchaseCandidate> & Pick<PurchaseCandidate, "id" | "date">
): PurchaseCandidate {
	return {
		duration: null,
		entranceNumber: null,
		usedEntranceCount: 0,
		...partial,
	};
}

describe("selectJustifyingPurchaseId", () => {
	it("prefers a valid membership over a pack with residual", () => {
		const purchases = [
			candidate({
				id: 1,
				date: new Date("2026-03-01T08:00:00.000Z"),
				entranceNumber: 10,
				usedEntranceCount: 0,
			}),
			candidate({
				id: 2,
				date: new Date("2026-03-10T08:00:00.000Z"),
				duration: 30,
			}),
		];
		assert.equal(selectJustifyingPurchaseId(purchases, at), 2);
	});

	it("among valid memberships picks max (date, id)", () => {
		const purchases = [
			candidate({
				id: 10,
				date: new Date("2026-03-01T08:00:00.000Z"),
				duration: 60,
			}),
			candidate({
				id: 20,
				date: new Date("2026-03-10T08:00:00.000Z"),
				duration: 30,
			}),
			candidate({
				id: 30,
				date: new Date("2026-03-10T08:00:00.000Z"),
				duration: 30,
			}),
		];
		assert.equal(selectJustifyingPurchaseId(purchases, at), 30);
	});

	it("falls back to FIFO pack: min (date, id) with residual > 0", () => {
		const purchases = [
			candidate({
				id: 5,
				date: new Date("2026-03-01T08:00:00.000Z"),
				entranceNumber: 5,
				usedEntranceCount: 5,
			}),
			candidate({
				id: 8,
				date: new Date("2026-02-01T08:00:00.000Z"),
				entranceNumber: 3,
				usedEntranceCount: 1,
			}),
			candidate({
				id: 9,
				date: new Date("2026-02-01T08:00:00.000Z"),
				entranceNumber: 3,
				usedEntranceCount: 0,
			}),
			candidate({
				id: 7,
				date: new Date("2026-03-05T08:00:00.000Z"),
				entranceNumber: 2,
				usedEntranceCount: 0,
			}),
		];
		assert.equal(selectJustifyingPurchaseId(purchases, at), 8);
	});

	it("rejects when only exhausted packs and no valid membership", () => {
		const purchases = [
			candidate({
				id: 1,
				date: new Date("2026-01-01T08:00:00.000Z"),
				duration: 10,
			}),
			candidate({
				id: 2,
				date: new Date("2026-03-01T08:00:00.000Z"),
				entranceNumber: 2,
				usedEntranceCount: 2,
			}),
		];
		assert.equal(selectJustifyingPurchaseId(purchases, at), null);
	});

	it("respects half-open membership window [date, date+duration)", () => {
		const soldAt = new Date("2026-03-01T10:00:00.000Z");
		const purchases = [
			candidate({ id: 1, date: soldAt, duration: 14 }),
		];
		assert.equal(
			selectJustifyingPurchaseId(purchases, new Date("2026-03-15T09:59:59.000Z")),
			1
		);
		assert.equal(
			selectJustifyingPurchaseId(purchases, new Date("2026-03-15T10:00:00.000Z")),
			null
		);
	});

	it("exposes a clear domain error message constant", () => {
		assert.match(NO_JUSTIFYING_PURCHASE_ERROR, /Acquisto|abbonamento|pacchetto/i);
	});
});
