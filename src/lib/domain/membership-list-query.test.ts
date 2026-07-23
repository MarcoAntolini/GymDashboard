import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	MEMBERSHIP_LIST_DEFAULT_SORT,
	MEMBERSHIP_LIST_FILTER_IDS,
	MEMBERSHIP_LIST_SORT_COLUMNS,
	buildMembershipListWhere,
	membershipListHasActiveFilters,
} from "./membership-list-query";

describe("buildMembershipListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildMembershipListWhere({}), {});
		assert.deepEqual(
			buildMembershipListWhere({
				productCode: "",
				duration: "   ",
				unknown: "x",
			}),
			{}
		);
	});

	it("builds contains clause for product code", () => {
		assert.deepEqual(buildMembershipListWhere({ productCode: "ABB" }), {
			AND: [{ productCode: { contains: "ABB" } }],
		});
	});

	it("builds exact match for duration when value is an integer string", () => {
		assert.deepEqual(buildMembershipListWhere({ duration: "30" }), {
			AND: [{ duration: 30 }],
		});
	});

	it("ignores non-integer duration and unknown keys", () => {
		assert.deepEqual(buildMembershipListWhere({ duration: "30g" }), {});
		assert.deepEqual(buildMembershipListWhere({ duration: "30.5" }), {});
		assert.deepEqual(
			buildMembershipListWhere({ productCode: "M", kind: "x" }),
			{
				AND: [{ productCode: { contains: "M" } }],
			}
		);
	});

	it("combines productCode and duration filters", () => {
		assert.deepEqual(
			buildMembershipListWhere({ productCode: "MEN", duration: "90" }),
			{
				AND: [{ productCode: { contains: "MEN" } }, { duration: 90 }],
			}
		);
	});

	it("reports whether any Abbonamenti list filters are active", () => {
		assert.equal(membershipListHasActiveFilters({}), false);
		assert.equal(membershipListHasActiveFilters({ productCode: "   " }), false);
		assert.equal(membershipListHasActiveFilters({ duration: "abc" }), false);
		assert.equal(membershipListHasActiveFilters({ productCode: "ABB" }), true);
		assert.equal(membershipListHasActiveFilters({ duration: "30" }), true);
	});
});

describe("membership list sort contract", () => {
	it("allows sortable Abbonamenti columns and defaults to productCode asc", () => {
		assert.deepEqual([...MEMBERSHIP_LIST_SORT_COLUMNS], [
			"productCode",
			"duration",
		]);
		assert.deepEqual(MEMBERSHIP_LIST_DEFAULT_SORT, {
			column: "productCode",
			direction: "asc",
		});
		assert.deepEqual([...MEMBERSHIP_LIST_FILTER_IDS], [
			"productCode",
			"duration",
		]);
	});
});
