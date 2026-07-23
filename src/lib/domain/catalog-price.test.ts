import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	formatCatalogPrice,
	isValidCatalogPriceString,
} from "./catalog-price";

describe("isValidCatalogPriceString", () => {
	it("accepts positive amounts with up to 2 decimals", () => {
		assert.equal(isValidCatalogPriceString("12"), true);
		assert.equal(isValidCatalogPriceString("12.5"), true);
		assert.equal(isValidCatalogPriceString("12.50"), true);
		assert.equal(isValidCatalogPriceString("0.01"), true);
	});

	it("rejects zero, negatives, and >2 decimals", () => {
		assert.equal(isValidCatalogPriceString("0"), false);
		assert.equal(isValidCatalogPriceString("0.00"), false);
		assert.equal(isValidCatalogPriceString("-1"), false);
		assert.equal(isValidCatalogPriceString("12.345"), false);
		assert.equal(isValidCatalogPriceString("abc"), false);
		assert.equal(isValidCatalogPriceString(""), false);
	});
});

describe("formatCatalogPrice", () => {
	it("formats number and string to 2 decimals", () => {
		assert.equal(formatCatalogPrice(12), "12.00");
		assert.equal(formatCatalogPrice("12.5"), "12.50");
	});

	it("formats Decimal-like toFixed objects", () => {
		assert.equal(formatCatalogPrice({ toFixed: (n: number) => (12.5).toFixed(n) }), "12.50");
	});
});
