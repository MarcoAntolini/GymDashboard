import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PURCHASE_LIST_DEFAULT_SORT,
	PURCHASE_LIST_FILTER_IDS,
	PURCHASE_LIST_SORT_COLUMNS,
	buildPurchaseListOrderBy,
	buildPurchaseListWhere,
	purchaseListHasActiveFilters,
} from "./purchase-list-query";

describe("buildPurchaseListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildPurchaseListWhere({}), {});
		assert.deepEqual(
			buildPurchaseListWhere({
				clientName: "",
				clientSurname: "   ",
				productCode: undefined,
				dateFrom: null,
				dateTo: "",
			}),
			{}
		);
	});

	it("builds contains for product code and join client name/surname", () => {
		assert.deepEqual(
			buildPurchaseListWhere({
				clientName: "Mario",
				clientSurname: "Rossi",
				productCode: "ABB",
			}),
			{
				AND: [
					{ client: { name: { contains: "Mario" } } },
					{ client: { surname: { contains: "Rossi" } } },
					{ productCode: { contains: "ABB" } },
				],
			}
		);
	});

	it("parses dateFrom/dateTo as day-bounded DateTime range", () => {
		const where = buildPurchaseListWhere({
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
			buildPurchaseListWhere({
				dateFrom: "not-a-date",
				dateTo: "2024-13-99",
				unknown: "x",
			}),
			{}
		);
	});

	it("reports whether any Acquisti list filters are active", () => {
		assert.equal(purchaseListHasActiveFilters({}), false);
		assert.equal(purchaseListHasActiveFilters({ productCode: "   " }), false);
		assert.equal(purchaseListHasActiveFilters({ productCode: "ABB" }), true);
		assert.equal(purchaseListHasActiveFilters({ clientSurname: "Rossi" }), true);
	});
});

describe("buildPurchaseListOrderBy", () => {
	it("maps nativa, snapshot and join sort columns to Prisma orderBy", () => {
		assert.deepEqual(buildPurchaseListOrderBy({ column: "id", direction: "asc" }), [
			{ id: "asc" },
		]);
		assert.deepEqual(buildPurchaseListOrderBy({ column: "date", direction: "desc" }), [
			{ date: "desc" },
			{ id: "desc" },
		]);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "amount", direction: "asc" }),
			[{ amount: "asc" }, { id: "asc" }]
		);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "productCode", direction: "desc" }),
			[{ productCode: "desc" }, { id: "desc" }]
		);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "duration", direction: "asc" }),
			[{ duration: "asc" }, { id: "asc" }]
		);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "entranceNumber", direction: "desc" }),
			[{ entranceNumber: "desc" }, { id: "desc" }]
		);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "client", direction: "asc" }),
			[
				{ client: { surname: "asc" } },
				{ client: { name: "asc" } },
				{ id: "asc" },
			]
		);
	});

	it("falls back to default date desc when sort is null or unknown", () => {
		assert.deepEqual(buildPurchaseListOrderBy(null), [
			{ date: "desc" },
			{ id: "desc" },
		]);
		assert.deepEqual(
			buildPurchaseListOrderBy({ column: "remainingEntrances", direction: "asc" }),
			[{ date: "desc" }, { id: "desc" }]
		);
	});
});

describe("purchase list sort contract", () => {
	it("allows sortable Acquisti columns and defaults to data desc", () => {
		assert.deepEqual([...PURCHASE_LIST_SORT_COLUMNS], [
			"id",
			"client",
			"date",
			"amount",
			"productCode",
			"duration",
			"entranceNumber",
		]);
		assert.deepEqual(PURCHASE_LIST_DEFAULT_SORT, {
			column: "date",
			direction: "desc",
		});
		assert.deepEqual([...PURCHASE_LIST_FILTER_IDS], [
			"dateFrom",
			"dateTo",
			"clientSurname",
			"clientName",
			"productCode",
		]);
	});
});
