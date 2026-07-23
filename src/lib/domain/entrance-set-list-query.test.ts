import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	ENTRANCE_SET_LIST_DEFAULT_SORT,
	ENTRANCE_SET_LIST_FILTER_IDS,
	ENTRANCE_SET_LIST_SORT_COLUMNS,
	buildEntranceSetListWhere,
	entranceSetListHasActiveFilters,
} from "./entrance-set-list-query";

describe("buildEntranceSetListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildEntranceSetListWhere({}), {});
		assert.deepEqual(
			buildEntranceSetListWhere({
				productCode: "",
				entranceNumber: "   ",
				unknown: "x",
			}),
			{}
		);
	});

	it("builds contains clause for product code", () => {
		assert.deepEqual(buildEntranceSetListWhere({ productCode: "PAC" }), {
			AND: [{ productCode: { contains: "PAC" } }],
		});
	});

	it("builds exact match for entranceNumber when value is an integer string", () => {
		assert.deepEqual(buildEntranceSetListWhere({ entranceNumber: "10" }), {
			AND: [{ entranceNumber: 10 }],
		});
	});

	it("ignores non-integer entranceNumber and unknown keys", () => {
		assert.deepEqual(buildEntranceSetListWhere({ entranceNumber: "10g" }), {});
		assert.deepEqual(buildEntranceSetListWhere({ entranceNumber: "10.5" }), {});
		assert.deepEqual(
			buildEntranceSetListWhere({ productCode: "P", kind: "x" }),
			{
				AND: [{ productCode: { contains: "P" } }],
			}
		);
	});

	it("combines productCode and entranceNumber filters", () => {
		assert.deepEqual(
			buildEntranceSetListWhere({
				productCode: "ING",
				entranceNumber: "20",
			}),
			{
				AND: [
					{ productCode: { contains: "ING" } },
					{ entranceNumber: 20 },
				],
			}
		);
	});

	it("reports whether any Pacchetti ingressi list filters are active", () => {
		assert.equal(entranceSetListHasActiveFilters({}), false);
		assert.equal(
			entranceSetListHasActiveFilters({ productCode: "   " }),
			false
		);
		assert.equal(
			entranceSetListHasActiveFilters({ entranceNumber: "abc" }),
			false
		);
		assert.equal(
			entranceSetListHasActiveFilters({ productCode: "PAC" }),
			true
		);
		assert.equal(
			entranceSetListHasActiveFilters({ entranceNumber: "10" }),
			true
		);
	});
});

describe("entrance set list sort contract", () => {
	it("allows sortable Pacchetti ingressi columns and defaults to productCode asc", () => {
		assert.deepEqual([...ENTRANCE_SET_LIST_SORT_COLUMNS], [
			"productCode",
			"entranceNumber",
		]);
		assert.deepEqual(ENTRANCE_SET_LIST_DEFAULT_SORT, {
			column: "productCode",
			direction: "asc",
		});
		assert.deepEqual([...ENTRANCE_SET_LIST_FILTER_IDS], [
			"productCode",
			"entranceNumber",
		]);
	});
});
