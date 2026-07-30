/**
 * Smoke: lista Listino server-side (ticket 26) — richiede DB.
 * Run: npx tsx scripts/smoke-list-catalogs.ts
 */
import { listCatalogs } from "../src/data-access/catalogs";
import {
	CATALOG_DEFAULT_SORT,
	CATALOG_FILTER_ALLOWLIST,
	CATALOG_SORT_ALLOWLIST,
} from "../src/lib/list/catalogs";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listCatalogs({
		page: 1,
		pageSize: 10,
		sort: [...CATALOG_DEFAULT_SORT],
	});

	assert(page1.page === 1, "page echo");
	assert(page1.pageSize === 10, "pageSize echo");
	assert(page1.items.length <= 10, "page size respected");
	assert(page1.total >= page1.items.length, "total >= items");
	assert(
		page1.pageCount === (page1.total === 0 ? 0 : Math.ceil(page1.total / 10)),
		"pageCount from total"
	);
	assert(
		page1.sort[0]?.id === "year" && page1.sort[0]?.desc === true,
		"default sort year desc"
	);
	assert(
		page1.sort[1]?.id === "productCode" && page1.sort[1]?.desc === false,
		"default sort productCode asc"
	);

	const filtered = await listCatalogs({
		filters: { productCode: "__no_such_catalog_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter -> total 0");
	assert(filtered.items.length === 0, "unmatched filter -> no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(CATALOG_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byCode = await listCatalogs({
			filters: { productCode: sample.productCode },
			page: 1,
			pageSize: 10,
		});
		assert(byCode.total > 0, "productCode filter finds rows");
		assert(
			byCode.items.every((m) => m.productCode.includes(sample.productCode)),
			"productCode filter matches"
		);

		const byYear = await listCatalogs({
			filters: { year: String(sample.year) },
			page: 1,
			pageSize: 10,
		});
		assert(byYear.total > 0, "year filter finds rows");
		assert(
			byYear.items.every((m) => m.year === sample.year),
			"year filter exact match"
		);
		assert("product" in sample, "include product");

		const byMembership = await listCatalogs({
			filters: { kind: "Membership" },
			page: 1,
			pageSize: 10,
		});
		assert(
			byMembership.items.every((m) => m.product.membership != null),
			"kind Membership filter matches"
		);

		const byEntranceSet = await listCatalogs({
			filters: { kind: "EntranceSet" },
			page: 1,
			pageSize: 10,
		});
		assert(
			byEntranceSet.items.every((m) => m.product.entranceSet != null),
			"kind EntranceSet filter matches"
		);

		const byBothKinds = await listCatalogs({
			filters: { kind: ["Membership", "EntranceSet"] },
			page: 1,
			pageSize: 10,
		});
		assert(
			byBothKinds.items.every(
				(m) => m.product.membership != null || m.product.entranceSet != null
			),
			"kind multi-select filter matches"
		);

		const badKind = await listCatalogs({
			filters: { kind: "NotAKind" },
			page: 1,
			pageSize: 10,
		});
		assert(badKind.total === page1.total, "invalid kind ignored in WHERE");
	}

	const badSort = await listCatalogs({
		sort: [{ id: "kind", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(CATALOG_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips derived kind"
	);
	assert(badSort.sort[0]?.id === "year", "fallback to default sort");

	const injectionSort = await listCatalogs({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		injectionSort.sort.every((s) =>
			(CATALOG_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	const priceSort = await listCatalogs({
		sort: [{ id: "price", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(priceSort.sort[0]?.id === "price", "price sort allowed");
	assert(priceSort.sort[0]?.desc === true, "price sort desc");
	if (priceSort.items.length >= 2) {
		assert(
			Number(priceSort.items[0].price) >= Number(priceSort.items[1].price),
			"price desc order"
		);
	}

	if (page1.total > 10) {
		const page2 = await listCatalogs({
			page: 2,
			pageSize: 10,
			sort: [...CATALOG_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const keys1 = new Set(
			page1.items.map((m) => `${m.year}:${m.productCode}`)
		);
		assert(
			page2.items.every((m) => !keys1.has(`${m.year}:${m.productCode}`)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-catalogs: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `${page1.items[0].year}/${page1.items[0].productCode}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
