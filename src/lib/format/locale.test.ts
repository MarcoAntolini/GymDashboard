import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	formatCurrencyEur,
	formatDateIt,
	formatDateTimeIt,
} from "./locale";

describe("formatDateIt / formatDateTimeIt", () => {
	it("formats calendar dates with abbreviated Italian month", () => {
		const label = formatDateIt(new Date(Date.UTC(2018, 9, 24, 12, 0, 0)));
		assert.match(label, /24/);
		assert.match(label, /2018/);
		assert.match(label.toLowerCase(), /ott/);
	});

	it("formats date-times with hour and minute", () => {
		const label = formatDateTimeIt(new Date(2024, 0, 15, 9, 5));
		assert.match(label, /15/);
		assert.match(label, /2024/);
		assert.match(label, /0?9/);
	});
});

describe("formatCurrencyEur", () => {
	it("formats EUR with it-IT separators", () => {
		const label = formatCurrencyEur(1234.5);
		assert.match(label, /1.?234/);
		assert.match(label, /50/);
		assert.match(label, /€/);
	});

	it("accepts numeric strings and returns em dash for invalid", () => {
		assert.match(formatCurrencyEur("10.00"), /10/);
		assert.equal(formatCurrencyEur("nope"), "—");
	});
});
