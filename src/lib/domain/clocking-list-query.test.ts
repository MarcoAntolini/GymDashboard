import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CLOCKING_LIST_DEFAULT_SORT,
	CLOCKING_LIST_FILTER_IDS,
	CLOCKING_LIST_SORT_COLUMNS,
	buildClockingListWhere,
	clockingListHasActiveFilters,
} from "./clocking-list-query";

describe("buildClockingListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildClockingListWhere({}), {});
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "",
			}),
			{}
		);
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "   ",
			}),
			{}
		);
	});

	it("builds exact employeeId when parseable", () => {
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "12",
			}),
			{
				AND: [{ employeeId: 12 }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable values", () => {
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "abc",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "7.5",
			}),
			{}
		);
		assert.deepEqual(
			buildClockingListWhere({
				employeeId: "-1",
			}),
			{}
		);
	});

	it("reports whether any Timbrature list filters are active", () => {
		assert.equal(clockingListHasActiveFilters({}), false);
		assert.equal(clockingListHasActiveFilters({ employeeId: "   " }), false);
		assert.equal(clockingListHasActiveFilters({ employeeId: "1" }), true);
	});
});

describe("clocking list sort contract", () => {
	it("allows sortable Timbrature columns and defaults to entranceTime desc", () => {
		assert.deepEqual([...CLOCKING_LIST_SORT_COLUMNS], [
			"employeeId",
			"entranceTime",
			"exitTime",
		]);
		assert.deepEqual(CLOCKING_LIST_DEFAULT_SORT, {
			column: "entranceTime",
			direction: "desc",
		});
		assert.deepEqual([...CLOCKING_LIST_FILTER_IDS], ["employeeId"]);
	});
});
