import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	EMPLOYEE_LIST_DEFAULT_SORT,
	EMPLOYEE_LIST_FILTER_IDS,
	EMPLOYEE_LIST_SORT_COLUMNS,
	buildEmployeeListWhere,
	employeeListHasActiveFilters,
} from "./employee-list-query";

describe("buildEmployeeListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildEmployeeListWhere({}), {});
		assert.deepEqual(
			buildEmployeeListWhere({
				taxCode: "",
				name: "   ",
				surname: undefined,
			}),
			{}
		);
	});

	it("builds contains clauses for text filters", () => {
		assert.deepEqual(
			buildEmployeeListWhere({
				taxCode: "RSSMRA",
				name: "Mario",
				surname: "Rossi",
				city: "Roma",
				province: "RM",
			}),
			{
				AND: [
					{ taxCode: { contains: "RSSMRA" } },
					{ name: { contains: "Mario" } },
					{ surname: { contains: "Rossi" } },
					{ city: { contains: "Roma" } },
					{ province: { contains: "RM" } },
				],
			}
		);
	});

	it("ignores unknown filter keys", () => {
		assert.deepEqual(
			buildEmployeeListWhere({ name: "Ada", unknown: "x", id: 1 }),
			{
				AND: [{ name: { contains: "Ada" } }],
			}
		);
	});

	it("coerces non-string filter values to string contains", () => {
		assert.deepEqual(buildEmployeeListWhere({ taxCode: 42 }), {
			AND: [{ taxCode: { contains: "42" } }],
		});
	});

	it("reports whether any Dipendenti list filters are active", () => {
		assert.equal(employeeListHasActiveFilters({}), false);
		assert.equal(employeeListHasActiveFilters({ name: "   " }), false);
		assert.equal(employeeListHasActiveFilters({ name: "Ada" }), true);
	});
});

describe("employee list sort contract", () => {
	it("allows sortable Dipendenti columns and defaults to cognome asc", () => {
		assert.deepEqual([...EMPLOYEE_LIST_SORT_COLUMNS], [
			"id",
			"taxCode",
			"name",
			"surname",
			"birthDate",
			"city",
			"province",
			"hiringDate",
		]);
		assert.deepEqual(EMPLOYEE_LIST_DEFAULT_SORT, {
			column: "surname",
			direction: "asc",
		});
		assert.deepEqual([...EMPLOYEE_LIST_FILTER_IDS], [
			"taxCode",
			"name",
			"surname",
			"city",
			"province",
		]);
	});
});
