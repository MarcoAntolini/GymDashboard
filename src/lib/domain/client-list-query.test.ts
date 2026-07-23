import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CLIENT_LIST_DEFAULT_SORT,
	CLIENT_LIST_FILTER_IDS,
	CLIENT_LIST_SORT_COLUMNS,
	buildClientListWhere,
	clientListHasActiveFilters,
} from "./client-list-query";

describe("buildClientListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildClientListWhere({}), {});
		assert.deepEqual(
			buildClientListWhere({
				taxCode: "",
				name: "   ",
				surname: undefined,
			}),
			{}
		);
	});

	it("builds case-insensitive contains clauses for text filters", () => {
		assert.deepEqual(
			buildClientListWhere({
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
			buildClientListWhere({ name: "Ada", unknown: "x", id: 1 }),
			{
				AND: [{ name: { contains: "Ada" } }],
			}
		);
	});

	it("coerces non-string filter values to string contains", () => {
		assert.deepEqual(buildClientListWhere({ taxCode: 42 }), {
			AND: [{ taxCode: { contains: "42" } }],
		});
	});

	it("reports whether any Clienti list filters are active", () => {
		assert.equal(clientListHasActiveFilters({}), false);
		assert.equal(clientListHasActiveFilters({ name: "   " }), false);
		assert.equal(clientListHasActiveFilters({ name: "Ada" }), true);
	});
});

describe("client list sort contract", () => {
	it("allows sortable Clienti columns and defaults to cognome asc", () => {
		assert.deepEqual([...CLIENT_LIST_SORT_COLUMNS], [
			"id",
			"taxCode",
			"name",
			"surname",
			"birthDate",
			"city",
			"province",
			"enrollmentDate",
		]);
		assert.deepEqual(CLIENT_LIST_DEFAULT_SORT, {
			column: "surname",
			direction: "asc",
		});
		assert.deepEqual([...CLIENT_LIST_FILTER_IDS], [
			"taxCode",
			"name",
			"surname",
			"city",
			"province",
		]);
	});
});
