import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	canJustifyEntranceAt,
	isMembershipValidAt,
	remainingEntrancesForPurchase,
} from "./purchase-snapshot.ts";

describe("remainingEntrancesForPurchase", () => {
	it("uses snapshot entranceNumber, not a live product value", () => {
		// Sold as 10; product may later change to 20 — residuo still from 10.
		assert.equal(remainingEntrancesForPurchase({ entranceNumber: 10 }, 3), 7);
	});

	it("returns null for membership purchases (no entrance pack)", () => {
		assert.equal(remainingEntrancesForPurchase({ entranceNumber: null }, 0), null);
	});

	it("returns 0 when pack is exhausted", () => {
		assert.equal(remainingEntrancesForPurchase({ entranceNumber: 5 }, 5), 0);
	});
});

describe("isMembershipValidAt", () => {
	const soldAt = new Date("2026-01-01T10:00:00.000Z");

	it("uses snapshot duration for the validity window", () => {
		const purchase = { date: soldAt, duration: 30 };
		assert.equal(isMembershipValidAt(purchase, new Date("2026-01-15T10:00:00.000Z")), true);
		assert.equal(isMembershipValidAt(purchase, new Date("2026-01-31T09:59:59.000Z")), true);
		assert.equal(isMembershipValidAt(purchase, new Date("2026-01-31T10:00:00.000Z")), false);
	});

	it("ignores product duration changes (snapshot stays fixed)", () => {
		// Product later edited to 365 days — Acquisto still has duration: 30.
		const purchase = { date: soldAt, duration: 30 };
		assert.equal(isMembershipValidAt(purchase, new Date("2026-06-01T10:00:00.000Z")), false);
	});

	it("returns false when purchase has no duration snapshot", () => {
		assert.equal(
			isMembershipValidAt({ date: soldAt, duration: null }, new Date("2026-01-02T10:00:00.000Z")),
			false
		);
	});
});

describe("canJustifyEntranceAt", () => {
	const soldAt = new Date("2026-03-01T08:00:00.000Z");

	it("justifies via membership snapshot while valid", () => {
		const purchase = { date: soldAt, duration: 10, entranceNumber: null };
		assert.equal(canJustifyEntranceAt(purchase, new Date("2026-03-05T08:00:00.000Z"), 0), true);
		assert.equal(canJustifyEntranceAt(purchase, new Date("2026-03-15T08:00:00.000Z"), 0), false);
	});

	it("justifies via pack residual from snapshot N", () => {
		const purchase = { date: soldAt, duration: null, entranceNumber: 3 };
		assert.equal(canJustifyEntranceAt(purchase, soldAt, 2), true);
		assert.equal(canJustifyEntranceAt(purchase, soldAt, 3), false);
	});
});
