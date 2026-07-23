import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	ENTRANCE_LIST_DEFAULT_SORT,
	ENTRANCE_LIST_FILTER_IDS,
	ENTRANCE_LIST_SORT_COLUMNS,
	buildEntranceListOrderBy,
	buildEntranceListWhere,
	entranceListHasActiveFilters,
} from "./entrance-list-query";

describe("buildEntranceListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildEntranceListWhere({}), {});
		assert.deepEqual(
			buildEntranceListWhere({
				clientName: "",
				clientSurname: "   ",
				productCode: undefined,
				dateFrom: null,
				dateTo: "",
				purchaseId: "  ",
			}),
			{}
		);
	});

	it("builds join contains for client name/surname and product code", () => {
		assert.deepEqual(
			buildEntranceListWhere({
				clientName: "Mario",
				clientSurname: "Rossi",
				productCode: "ABB",
			}),
			{
				AND: [
					{ purchase: { client: { name: { contains: "Mario" } } } },
					{ purchase: { client: { surname: { contains: "Rossi" } } } },
					{ purchase: { productCode: { contains: "ABB" } } },
				],
			}
		);
	});

	it("parses purchaseId as exact integer match", () => {
		assert.deepEqual(buildEntranceListWhere({ purchaseId: "42" }), {
			AND: [{ purchaseId: 42 }],
		});
		assert.deepEqual(buildEntranceListWhere({ purchaseId: "nope" }), {});
	});

	it("parses dateFrom/dateTo as day-bounded DateTime range", () => {
		const where = buildEntranceListWhere({
			dateFrom: "2024-01-15",
			dateTo: "2024-01-20",
		});
		assert.ok(where.AND);
		const and = where.AND as Record<string, unknown>[];
		assert.equal(and.length, 1);
		const dateClause = and[0]!.date as {
			gte?: Date;
			lte?: Date;
		};
		assert.ok(dateClause.gte instanceof Date);
		assert.ok(dateClause.lte instanceof Date);
		assert.equal(dateClause.gte!.toISOString().slice(0, 10), "2024-01-15");
		assert.equal(dateClause.lte!.toISOString().slice(0, 10), "2024-01-20");
		assert.equal(dateClause.lte!.getUTCHours(), 23);
	});

	it("ignores invalid date strings and unknown keys", () => {
		assert.deepEqual(
			buildEntranceListWhere({
				dateFrom: "not-a-date",
				dateTo: "2024-13-99",
				unknown: "x",
			}),
			{}
		);
	});

	it("reports whether any Ingressi list filters are active", () => {
		assert.equal(entranceListHasActiveFilters({}), false);
		assert.equal(entranceListHasActiveFilters({ clientName: "   " }), false);
		assert.equal(entranceListHasActiveFilters({ clientName: "Ada" }), true);
		assert.equal(entranceListHasActiveFilters({ purchaseId: "7" }), true);
	});
});

describe("buildEntranceListOrderBy", () => {
	it("maps nativa and join sort columns to Prisma orderBy", () => {
		assert.deepEqual(buildEntranceListOrderBy({ column: "id", direction: "asc" }), [
			{ id: "asc" },
		]);
		assert.deepEqual(buildEntranceListOrderBy({ column: "date", direction: "desc" }), [
			{ date: "desc" },
			{ id: "desc" },
		]);
		assert.deepEqual(
			buildEntranceListOrderBy({ column: "purchase", direction: "asc" }),
			[{ purchaseId: "asc" }, { id: "asc" }]
		);
		assert.deepEqual(
			buildEntranceListOrderBy({ column: "client", direction: "asc" }),
			[
				{ purchase: { client: { surname: "asc" } } },
				{ purchase: { client: { name: "asc" } } },
				{ id: "asc" },
			]
		);
		assert.deepEqual(
			buildEntranceListOrderBy({ column: "product", direction: "desc" }),
			[{ purchase: { productCode: "desc" } }, { id: "desc" }]
		);
	});

	it("falls back to default date desc when sort is null", () => {
		assert.deepEqual(buildEntranceListOrderBy(null), [
			{ date: "desc" },
			{ id: "desc" },
		]);
	});
});

describe("entrance list sort contract", () => {
	it("allows sortable Ingressi columns and defaults to data desc", () => {
		assert.deepEqual([...ENTRANCE_LIST_SORT_COLUMNS], [
			"id",
			"client",
			"date",
			"purchase",
			"product",
		]);
		assert.deepEqual(ENTRANCE_LIST_DEFAULT_SORT, {
			column: "date",
			direction: "desc",
		});
		assert.deepEqual([...ENTRANCE_LIST_FILTER_IDS], [
			"dateFrom",
			"dateTo",
			"clientSurname",
			"clientName",
			"productCode",
			"purchaseId",
		]);
	});
});
