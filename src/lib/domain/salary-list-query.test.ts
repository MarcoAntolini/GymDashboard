import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	SALARY_LIST_DEFAULT_SORT,
	SALARY_LIST_FILTER_IDS,
	SALARY_LIST_SORT_COLUMNS,
	buildSalaryListWhere,
	salaryListHasActiveFilters,
} from "./salary-list-query";

describe("buildSalaryListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildSalaryListWhere({}), {});
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "",
				employeeId: "",
			}),
			{}
		);
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "   ",
				employeeId: "   ",
			}),
			{}
		);
	});

	it("builds exact paymentId and employeeId when parseable", () => {
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "3",
			}),
			{
				AND: [{ paymentId: 3 }],
			}
		);
		assert.deepEqual(
			buildSalaryListWhere({
				employeeId: "12",
			}),
			{
				AND: [{ employeeId: 12 }],
			}
		);
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "3",
				employeeId: "12",
			}),
			{
				AND: [{ paymentId: 3 }, { employeeId: 12 }],
			}
		);
	});

	it("ignores unknown filter keys and unparseable values", () => {
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "abc",
				employeeId: "7.5",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(
			buildSalaryListWhere({
				paymentId: "-1",
				employeeId: "-2",
			}),
			{}
		);
	});

	it("reports whether any Stipendi list filters are active", () => {
		assert.equal(salaryListHasActiveFilters({}), false);
		assert.equal(salaryListHasActiveFilters({ paymentId: "   " }), false);
		assert.equal(salaryListHasActiveFilters({ paymentId: "1" }), true);
		assert.equal(salaryListHasActiveFilters({ employeeId: "2" }), true);
	});
});

describe("salary list sort contract", () => {
	it("allows sortable Stipendi columns and defaults to paymentId asc", () => {
		assert.deepEqual([...SALARY_LIST_SORT_COLUMNS], ["paymentId", "employeeId"]);
		assert.deepEqual(SALARY_LIST_DEFAULT_SORT, {
			column: "paymentId",
			direction: "asc",
		});
		assert.deepEqual([...SALARY_LIST_FILTER_IDS], ["paymentId", "employeeId"]);
	});
});
