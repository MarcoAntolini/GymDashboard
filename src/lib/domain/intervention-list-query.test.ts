import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	INTERVENTION_LIST_DEFAULT_SORT,
	INTERVENTION_LIST_FILTER_IDS,
	INTERVENTION_LIST_SORT_COLUMNS,
	buildInterventionListWhere,
	interventionListHasActiveFilters,
} from "./intervention-list-query";

describe("buildInterventionListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildInterventionListWhere({}), {});
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "",
				maker: "",
			}),
			{}
		);
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "   ",
				maker: "   ",
			}),
			{}
		);
	});

	it("builds exact paymentId and maker contains when set", () => {
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "3",
			}),
			{
				AND: [{ paymentId: 3 }],
			}
		);
		assert.deepEqual(
			buildInterventionListWhere({
				maker: "Rossi Impianti",
			}),
			{
				AND: [{ maker: { contains: "Rossi Impianti" } }],
			}
		);
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "3",
				maker: "  Rossi Impianti  ",
			}),
			{
				AND: [{ paymentId: 3 }, { maker: { contains: "Rossi Impianti" } }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable paymentId", () => {
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "abc",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildInterventionListWhere({
				paymentId: "-1",
				maker: "7.5",
			}),
			{
				AND: [{ maker: { contains: "7.5" } }],
			}
		);
	});

	it("reports whether any Interventi list filters are active", () => {
		assert.equal(interventionListHasActiveFilters({}), false);
		assert.equal(interventionListHasActiveFilters({ paymentId: "   " }), false);
		assert.equal(interventionListHasActiveFilters({ paymentId: "1" }), true);
		assert.equal(
			interventionListHasActiveFilters({ maker: "Rossi Impianti" }),
			true
		);
	});
});

describe("intervention list sort contract", () => {
	it("allows sortable Interventi columns and defaults to paymentId asc", () => {
		assert.deepEqual(
			[...INTERVENTION_LIST_SORT_COLUMNS],
			["paymentId", "description", "maker", "startingTime", "endingTime"]
		);
		assert.deepEqual(INTERVENTION_LIST_DEFAULT_SORT, {
			column: "paymentId",
			direction: "asc",
		});
		assert.deepEqual([...INTERVENTION_LIST_FILTER_IDS], ["paymentId", "maker"]);
	});
});
