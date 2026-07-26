/**
 * Smoke: lista Prodotti server-side (ticket 23) — richiede DB.
 * Run: npx tsx scripts/smoke-list-products.ts
 */
import { listProducts } from "../src/data-access/products";
import {
	PRODUCT_DEFAULT_SORT,
	PRODUCT_FILTER_ALLOWLIST,
	PRODUCT_SORT_ALLOWLIST,
} from "../src/lib/list/products";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listProducts({
		page: 1,
		pageSize: 10,
		sort: [...PRODUCT_DEFAULT_SORT],
	});

	assert(page1.page === 1, "page echo");
	assert(page1.pageSize === 10, "pageSize echo");
	assert(page1.items.length <= 10, "page size respected");
	assert(page1.total >= page1.items.length, "total ≥ items");
	assert(
		page1.pageCount === (page1.total === 0 ? 0 : Math.ceil(page1.total / 10)),
		"pageCount from total"
	);
	assert(
		page1.sort[0]?.id === "code" && page1.sort[0]?.desc === false,
		"default sort code asc"
	);

	const filtered = await listProducts({
		filters: { code: "__no_such_product_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(PRODUCT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byCode = await listProducts({
			filters: { code: sample.code },
			page: 1,
			pageSize: 10,
		});
		assert(byCode.total > 0, "code filter finds rows");
		assert(
			byCode.items.every((p) => p.code.includes(sample.code)),
			"code filter matches"
		);
		assert("membership" in sample && "entranceSet" in sample, "include specs");
	}

	const badSort = await listProducts({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(PRODUCT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "code", "fallback to default sort");

	const kindSort = await listProducts({
		sort: [{ id: "kind", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		kindSort.sort.every((s) =>
			(PRODUCT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"derived kind sort stripped"
	);
	assert(kindSort.sort[0]?.id === "code", "kind sort → default code");

	if (page1.total > 10) {
		const page2 = await listProducts({
			page: 2,
			pageSize: 10,
			sort: [...PRODUCT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const codes1 = new Set(page1.items.map((p) => p.code));
		assert(
			page2.items.every((p) => !codes1.has(p.code)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-products: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0] ? page1.items[0].code : "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
