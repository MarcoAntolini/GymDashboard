import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	PRODUCT_LIST_DEFAULT_SORT,
	PRODUCT_LIST_FILTER_IDS,
	PRODUCT_LIST_SORT_COLUMNS,
	buildProductListWhere,
	productListHasActiveFilters,
} from "./product-list-query";

describe("buildProductListWhere", () => {
	it("returns empty where when filters are blank", () => {
		assert.deepEqual(buildProductListWhere({}), {});
		assert.deepEqual(
			buildProductListWhere({
				code: "",
				unknown: "x",
			}),
			{}
		);
		assert.deepEqual(buildProductListWhere({ code: "   " }), {});
	});

	it("builds contains clause for product code", () => {
		assert.deepEqual(buildProductListWhere({ code: "ABB" }), {
			AND: [{ code: { contains: "ABB" } }],
		});
	});

	it("ignores unknown filter keys and coerces non-string values", () => {
		assert.deepEqual(buildProductListWhere({ code: 12, kind: "Membership" }), {
			AND: [{ code: { contains: "12" } }],
		});
	});

	it("reports whether any Prodotti list filters are active", () => {
		assert.equal(productListHasActiveFilters({}), false);
		assert.equal(productListHasActiveFilters({ code: "   " }), false);
		assert.equal(productListHasActiveFilters({ code: "ABB" }), true);
	});
});

describe("product list sort contract", () => {
	it("allows sortable Prodotti columns and defaults to code asc", () => {
		assert.deepEqual([...PRODUCT_LIST_SORT_COLUMNS], ["code"]);
		assert.deepEqual(PRODUCT_LIST_DEFAULT_SORT, {
			column: "code",
			direction: "asc",
		});
		assert.deepEqual([...PRODUCT_LIST_FILTER_IDS], ["code"]);
	});
});
