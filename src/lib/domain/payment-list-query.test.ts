import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PAYMENT_LIST_DEFAULT_SORT,
	PAYMENT_LIST_FILTER_IDS,
	PAYMENT_LIST_SORT_COLUMNS,
	buildPaymentListWhere,
	paymentListHasActiveFilters,
} from "./payment-list-query";

describe("buildPaymentListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildPaymentListWhere({}), {});
		assert.deepEqual(
			buildPaymentListWhere({
				type: "",
			}),
			{}
		);
		assert.deepEqual(
			buildPaymentListWhere({
				type: "   ",
			}),
			{}
		);
	});

	it("builds exact type from Prisma enum key or IT label", () => {
		assert.deepEqual(
			buildPaymentListWhere({
				type: "Salary",
			}),
			{
				AND: [{ type: "Stipendio" }],
			}
		);
		assert.deepEqual(
			buildPaymentListWhere({
				type: "Bolletta",
			}),
			{
				AND: [{ type: "Bolletta" }],
			}
		);
		assert.deepEqual(
			buildPaymentListWhere({
				type: "  intervento  ",
			}),
			{
				AND: [{ type: "Intervento" }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable type", () => {
		assert.deepEqual(
			buildPaymentListWhere({
				type: "Spesa",
				unknown: "x",
			}),
			{}
		);
	});

	it("reports whether any Pagamenti list filters are active", () => {
		assert.equal(paymentListHasActiveFilters({}), false);
		assert.equal(paymentListHasActiveFilters({ type: "   " }), false);
		assert.equal(paymentListHasActiveFilters({ type: "Salary" }), true);
		assert.equal(paymentListHasActiveFilters({ type: "Stipendio" }), true);
	});
});

describe("payment list sort contract", () => {
	it("allows sortable Pagamenti columns and defaults to id asc", () => {
		assert.deepEqual(
			[...PAYMENT_LIST_SORT_COLUMNS],
			["id", "date", "amount", "type"]
		);
		assert.deepEqual(PAYMENT_LIST_DEFAULT_SORT, {
			column: "id",
			direction: "asc",
		});
		assert.deepEqual([...PAYMENT_LIST_FILTER_IDS], ["type"]);
	});
});
