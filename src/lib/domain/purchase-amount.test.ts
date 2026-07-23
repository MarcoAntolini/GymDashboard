import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	catalogYearFromDate,
	resolvePurchaseAmountString,
} from "./purchase-amount";

describe("catalogYearFromDate", () => {
	it("returns the calendar year of the purchase date", () => {
		assert.equal(catalogYearFromDate(new Date("2026-07-23T12:00:00.000Z")), 2026);
		assert.equal(catalogYearFromDate(new Date(2024, 0, 1)), 2024);
	});
});

describe("resolvePurchaseAmountString", () => {
	it("prefers an explicit override (sconto) over Listino", () => {
		assert.equal(resolvePurchaseAmountString("40.00", "50.00"), "40.00");
		assert.equal(resolvePurchaseAmountString("40.5", "50.00"), "40.50");
	});

	it("falls back to Listino price when override is empty", () => {
		assert.equal(resolvePurchaseAmountString("", "50.00"), "50.00");
		assert.equal(resolvePurchaseAmountString(undefined, "12.5"), "12.50");
		assert.equal(resolvePurchaseAmountString(null, "99"), "99.00");
	});

	it("rejects invalid override and missing Listino", () => {
		assert.throws(
			() => resolvePurchaseAmountString("12.345", "50.00"),
			(err: unknown) => err instanceof Error && /Importo non valido/.test(err.message)
		);
		assert.throws(
			() => resolvePurchaseAmountString("", null),
			(err: unknown) =>
				err instanceof Error && /nessun prezzo Listino/.test(err.message)
		);
		assert.throws(
			() => resolvePurchaseAmountString(undefined, undefined),
			(err: unknown) =>
				err instanceof Error && /nessun prezzo Listino/.test(err.message)
		);
	});
});
