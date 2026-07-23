import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	BILL_LIST_DEFAULT_SORT,
	BILL_LIST_FILTER_IDS,
	BILL_LIST_SORT_COLUMNS,
	billListHasActiveFilters,
	buildBillListWhere,
} from "./bill-list-query";

describe("buildBillListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildBillListWhere({}), {});
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "",
				provider: "",
			}),
			{}
		);
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "   ",
				provider: "   ",
			}),
			{}
		);
	});

	it("builds exact paymentId and provider contains when set", () => {
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "3",
			}),
			{
				AND: [{ paymentId: 3 }],
			}
		);
		assert.deepEqual(
			buildBillListWhere({
				provider: "Enel",
			}),
			{
				AND: [{ provider: { contains: "Enel" } }],
			}
		);
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "3",
				provider: "  Enel  ",
			}),
			{
				AND: [{ paymentId: 3 }, { provider: { contains: "Enel" } }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable paymentId", () => {
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "abc",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildBillListWhere({
				paymentId: "-1",
				provider: "7.5",
			}),
			{
				AND: [{ provider: { contains: "7.5" } }],
			}
		);
	});

	it("reports whether any Bollette list filters are active", () => {
		assert.equal(billListHasActiveFilters({}), false);
		assert.equal(billListHasActiveFilters({ paymentId: "   " }), false);
		assert.equal(billListHasActiveFilters({ paymentId: "1" }), true);
		assert.equal(billListHasActiveFilters({ provider: "Enel" }), true);
	});
});

describe("bill list sort contract", () => {
	it("allows sortable Bollette columns and defaults to paymentId asc", () => {
		assert.deepEqual(
			[...BILL_LIST_SORT_COLUMNS],
			["paymentId", "description", "provider"]
		);
		assert.deepEqual(BILL_LIST_DEFAULT_SORT, {
			column: "paymentId",
			direction: "asc",
		});
		assert.deepEqual([...BILL_LIST_FILTER_IDS], ["paymentId", "provider"]);
	});
});
