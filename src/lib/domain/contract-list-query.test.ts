import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ContractType } from "@prisma/client";
import {
	CONTRACT_LIST_DEFAULT_SORT,
	CONTRACT_LIST_FILTER_IDS,
	CONTRACT_LIST_SORT_COLUMNS,
	buildContractListOrderBy,
	buildContractListWhere,
	contractListHasActiveFilters,
} from "./contract-list-query";

describe("buildContractListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildContractListWhere({}), {});
		assert.deepEqual(
			buildContractListWhere({
				employeeSurname: "",
				employeeName: "   ",
				type: "   ",
			}),
			{}
		);
	});

	it("builds contains on Dipendente name fields and exact type", () => {
		assert.deepEqual(
			buildContractListWhere({
				employeeSurname: "Rossi",
				employeeName: "Mario",
				type: "FixedTerm",
			}),
			{
				AND: [
					{ employee: { surname: { contains: "Rossi" } } },
					{ employee: { name: { contains: "Mario" } } },
					{ type: ContractType.FixedTerm },
				],
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

	it("ignores unknown filter keys and unparseable type", () => {
		assert.deepEqual(
			buildContractListWhere({
				type: "Permanent",
				unknown: "x",
				employeeId: "12",
			}),
			{}
		);
	});

	it("reports whether any Contratti list filters are active", () => {
		assert.equal(contractListHasActiveFilters({}), false);
		assert.equal(
			contractListHasActiveFilters({ employeeSurname: "   " }),
			false
		);
		assert.equal(
			contractListHasActiveFilters({ employeeSurname: "Rossi" }),
			true
		);
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
			"employee",
			"type",
			"hourlyFee",
			"startingDate",
			"endingDate",
		]);
		assert.deepEqual(CONTRACT_LIST_DEFAULT_SORT, {
			column: "employeeId",
			direction: "asc",
		});
		assert.deepEqual([...CONTRACT_LIST_FILTER_IDS], [
			"employeeSurname",
			"employeeName",
			"type",
		]);
	});

	it("maps employee join sort to Prisma orderBy", () => {
		assert.deepEqual(
			buildContractListOrderBy({ column: "employee", direction: "asc" }),
			[
				{ employee: { surname: "asc" } },
				{ employee: { name: "asc" } },
				{ startingDate: "asc" },
			]
		);
	});
});
