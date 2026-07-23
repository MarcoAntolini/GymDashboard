import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContractType } from "@prisma/client";
import {
	CONTRACT_LIST_DEFAULT_SORT,
	CONTRACT_LIST_FILTER_IDS,
	CONTRACT_LIST_SORT_COLUMNS,
	buildContractListWhere,
	contractListHasActiveFilters,
} from "./contract-list-query";

describe("buildContractListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildContractListWhere({}), {});
		assert.deepEqual(
			buildContractListWhere({
				employeeId: "",
				type: "   ",
			}),
			{}
		);
	});

	it("builds exact employeeId and type when parseable", () => {
		assert.deepEqual(
			buildContractListWhere({
				employeeId: "12",
				type: "FixedTerm",
			}),
			{
				AND: [{ employeeId: 12 }, { type: ContractType.FixedTerm }],
			}
		);
	});

	it("parses type case-insensitively (keys + IT labels)", () => {
		assert.deepEqual(buildContractListWhere({ type: "openended" }), {
			AND: [{ type: ContractType.OpenEnded }],
		});
		assert.deepEqual(
			buildContractListWhere({ type: "tempo determinato" }),
			{
				AND: [{ type: ContractType.FixedTerm }],
			}
		);
		assert.deepEqual(
			buildContractListWhere({ type: "Tempo indeterminato" }),
			{
				AND: [{ type: ContractType.OpenEnded }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable values", () => {
		assert.deepEqual(
			buildContractListWhere({
				employeeId: "abc",
				type: "Permanent",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildContractListWhere({
				employeeId: "7",
				type: "maybe",
			}),
			{
				AND: [{ employeeId: 7 }],
			}
		);
	});

	it("reports whether any Contratti list filters are active", () => {
		assert.equal(contractListHasActiveFilters({}), false);
		assert.equal(contractListHasActiveFilters({ employeeId: "   " }), false);
		assert.equal(contractListHasActiveFilters({ employeeId: "1" }), true);
		assert.equal(contractListHasActiveFilters({ type: "FixedTerm" }), true);
		assert.equal(
			contractListHasActiveFilters({ type: "Tempo determinato" }),
			true
		);
	});
});

describe("contract list sort contract", () => {
	it("allows sortable Contratti columns and defaults to employeeId asc", () => {
		assert.deepEqual([...CONTRACT_LIST_SORT_COLUMNS], [
			"employeeId",
			"type",
			"hourlyFee",
			"startingDate",
			"endingDate",
		]);
		assert.deepEqual(CONTRACT_LIST_DEFAULT_SORT, {
			column: "employeeId",
			direction: "asc",
		});
		assert.deepEqual([...CONTRACT_LIST_FILTER_IDS], ["employeeId", "type"]);
	});
});
