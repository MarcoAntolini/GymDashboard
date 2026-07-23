import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Role } from "@prisma/client";
import {
	ACCOUNT_LIST_DEFAULT_SORT,
	ACCOUNT_LIST_FILTER_IDS,
	ACCOUNT_LIST_SORT_COLUMNS,
	accountListHasActiveFilters,
	buildAccountListWhere,
} from "./account-list-query";

describe("buildAccountListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildAccountListWhere({}), {});
		assert.deepEqual(
			buildAccountListWhere({
				username: "",
				role: "   ",
				approved: undefined,
			}),
			{}
		);
	});

	it("builds contains for username and exact role/approved when parseable", () => {
		assert.deepEqual(
			buildAccountListWhere({
				username: "mario",
				role: "Admin",
				approved: "true",
			}),
			{
				AND: [
					{ username: { contains: "mario" } },
					{ role: Role.Admin },
					{ approved: true },
				],
			}
		);
	});

	it("parses role case-insensitively (keys + IT labels) and approved aliases", () => {
		assert.deepEqual(buildAccountListWhere({ role: "employee" }), {
			AND: [{ role: Role.Employee }],
		});
		assert.deepEqual(buildAccountListWhere({ role: "amministratore" }), {
			AND: [{ role: Role.Admin }],
		});
		assert.deepEqual(buildAccountListWhere({ approved: "no" }), {
			AND: [{ approved: false }],
		});
		assert.deepEqual(buildAccountListWhere({ approved: "1" }), {
			AND: [{ approved: true }],
		});
	});

	it("ignores unknown filter keys and unparseable role/approved", () => {
		assert.deepEqual(
			buildAccountListWhere({
				username: "ada",
				role: "Superuser",
				approved: "maybe",
				unknown: "x",
			}),
			{
				AND: [{ username: { contains: "ada" } }],
			}
		);
	});

	it("parses employeeId as exact integer match", () => {
		assert.deepEqual(buildAccountListWhere({ employeeId: "12" }), {
			AND: [{ employeeId: 12 }],
		});
		assert.deepEqual(buildAccountListWhere({ employeeId: "abc" }), {});
	});

	it("reports whether any Account list filters are active", () => {
		assert.equal(accountListHasActiveFilters({}), false);
		assert.equal(accountListHasActiveFilters({ username: "   " }), false);
		assert.equal(accountListHasActiveFilters({ username: "ada" }), true);
		assert.equal(accountListHasActiveFilters({ role: "Owner" }), true);
		assert.equal(accountListHasActiveFilters({ role: "Proprietario" }), true);
	});
});

describe("account list sort contract", () => {
	it("allows sortable Account columns and defaults to employeeId asc", () => {
		assert.deepEqual([...ACCOUNT_LIST_SORT_COLUMNS], [
			"employeeId",
			"username",
		]);
		assert.deepEqual(ACCOUNT_LIST_DEFAULT_SORT, {
			column: "employeeId",
			direction: "asc",
		});
		assert.deepEqual([...ACCOUNT_LIST_FILTER_IDS], [
			"username",
			"role",
			"approved",
			"employeeId",
		]);
	});
});
