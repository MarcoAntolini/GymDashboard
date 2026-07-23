import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CONTRACT_OVERLAP_ERROR,
	contractIntervalsOverlap,
} from "./contract-intervals.ts";

const d = (iso: string) => new Date(iso);

describe("contractIntervalsOverlap", () => {
	it("detects overlapping closed intervals (half-open)", () => {
		assert.equal(
			contractIntervalsOverlap(
				{ startingDate: d("2026-01-01"), endingDate: d("2026-06-01") },
				{ startingDate: d("2026-03-01"), endingDate: d("2026-09-01") }
			),
			true
		);
	});

	it("treats null endingDate as +∞", () => {
		assert.equal(
			contractIntervalsOverlap(
				{ startingDate: d("2026-01-01"), endingDate: null },
				{ startingDate: d("2026-06-01"), endingDate: d("2026-07-01") }
			),
			true
		);
		assert.equal(
			contractIntervalsOverlap(
				{ startingDate: d("2025-01-01"), endingDate: d("2025-06-01") },
				{ startingDate: d("2026-01-01"), endingDate: null }
			),
			false
		);
	});

	it("allows adjacent half-open intervals (touching boundary)", () => {
		assert.equal(
			contractIntervalsOverlap(
				{ startingDate: d("2026-01-01"), endingDate: d("2026-02-01") },
				{ startingDate: d("2026-02-01"), endingDate: d("2026-03-01") }
			),
			false
		);
	});

	it("detects containment", () => {
		assert.equal(
			contractIntervalsOverlap(
				{ startingDate: d("2026-01-01"), endingDate: d("2026-12-01") },
				{ startingDate: d("2026-03-01"), endingDate: d("2026-04-01") }
			),
			true
		);
	});

	it("exports a clear Italian error message", () => {
		assert.match(CONTRACT_OVERLAP_ERROR, /sovrapp/i);
		assert.match(CONTRACT_OVERLAP_ERROR, /Contratto/);
	});
});
