import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CATALOG_LIST_DEFAULT_SORT,
	CATALOG_LIST_FILTER_IDS,
	CATALOG_LIST_SORT_COLUMNS,
	buildCatalogListWhere,
	catalogListHasActiveFilters,
} from "./catalog-list-query";

describe("buildCatalogListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildCatalogListWhere({}), {});
		assert.deepEqual(
			buildCatalogListWhere({
				year: "",
				productCode: "   ",
				unknown: "x",
			}),
			{}
		);
	});

	it("builds exact match for year when value is an integer string", () => {
		assert.deepEqual(buildCatalogListWhere({ year: "2024" }), {
			AND: [{ year: 2024 }],
		});
	});

	it("builds contains clause for product code", () => {
		assert.deepEqual(buildCatalogListWhere({ productCode: "ABB" }), {
			AND: [{ productCode: { contains: "ABB" } }],
		});
	});

	it("ignores non-integer year and unknown keys", () => {
		assert.deepEqual(buildCatalogListWhere({ year: "2024a" }), {});
		assert.deepEqual(buildCatalogListWhere({ year: "20.24" }), {});
		assert.deepEqual(
			buildCatalogListWhere({ productCode: "P", productKind: "Membership" }),
			{
				AND: [{ productCode: { contains: "P" } }],
			}
		);
	});

	it("combines year and productCode filters", () => {
		assert.deepEqual(
			buildCatalogListWhere({
				year: "2025",
				productCode: "ING",
			}),
			{
				AND: [{ year: 2025 }, { productCode: { contains: "ING" } }],
			}
		);
	});

	it("reports whether any Listino list filters are active", () => {
		assert.equal(catalogListHasActiveFilters({}), false);
		assert.equal(catalogListHasActiveFilters({ year: "   " }), false);
		assert.equal(catalogListHasActiveFilters({ year: "abc" }), false);
		assert.equal(catalogListHasActiveFilters({ year: "2024" }), true);
		assert.equal(catalogListHasActiveFilters({ productCode: "ABB" }), true);
	});
});

describe("catalog list sort contract", () => {
	it("allows sortable Listino nativa columns and defaults to year desc", () => {
		assert.deepEqual([...CATALOG_LIST_SORT_COLUMNS], [
			"year",
			"productCode",
			"price",
		]);
		assert.deepEqual(CATALOG_LIST_DEFAULT_SORT, {
			column: "year",
			direction: "desc",
		});
		assert.deepEqual([...CATALOG_LIST_FILTER_IDS], ["year", "productCode"]);
	});
});
