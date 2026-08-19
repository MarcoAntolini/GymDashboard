/**
 * Smoke: lista Vendite server-side (ticket 22) — richiede DB.
 * Run: npx tsx scripts/smoke-list-sales.ts
 */
import { listSales } from "../src/data-access/sales";
import {
	SALE_DEFAULT_SORT,
	SALE_FILTER_ALLOWLIST,
	SALE_SORT_ALLOWLIST,
} from "../src/lib/list/sales";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listSales({
		page: 1,
		pageSize: 10,
		sort: [...SALE_DEFAULT_SORT],
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
		page1.sort[0]?.id === "date" && page1.sort[0]?.desc === true,
		"default sort date desc"
	);

	const filtered = await listSales({
		filters: { client: "__no_such_client_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(SALE_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byClientId = await listSales({
			filters: { clientId: String(sample.clientId) },
			page: 1,
			pageSize: 10,
		});
		assert(byClientId.total > 0, "clientId filter finds rows");
		assert(
			byClientId.items.every((p) => p.clientId === sample.clientId),
			"clientId filter matches Cliente column"
		);

		const bySaleId = await listSales({
			filters: { id: String(sample.id) },
			page: 1,
			pageSize: 10,
		});
		assert(bySaleId.total === 1, "id filter → single sale");
		assert(bySaleId.items[0]?.id === sample.id, "id filter exact");

		const byProduct = await listSales({
			filters: { productCode: sample.productCode },
			page: 1,
			pageSize: 10,
		});
		assert(byProduct.total > 0, "productCode filter finds rows");
		assert(
			byProduct.items.every((p) => p.productCode.includes(sample.productCode)),
			"productCode filter matches"
		);

		const clientIdAsSaleId = await listSales({
			filters: { id: String(sample.clientId) },
			page: 1,
			pageSize: 10,
		});
		assert(
			clientIdAsSaleId.items.every((p) => p.id === sample.clientId),
			"id does not silently match clientId"
		);
	}

	const badSort = await listSales({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(SALE_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "date", "fallback to default sort");

	const byClient = await listSales({
		sort: [{ id: "client", desc: false }],
		page: 1,
		pageSize: 10,
	});
	assert(byClient.sort[0]?.id === "client", "join sort client accepted");

	const byAmount = await listSales({
		sort: [{ id: "amount", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(byAmount.sort[0]?.id === "amount", "snapshot sort amount accepted");

	if (page1.total > 10) {
		const page2 = await listSales({
			page: 2,
			pageSize: 10,
			sort: [...SALE_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((p) => p.id));
		assert(
			page2.items.every((p) => !ids1.has(p.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-sales: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `${page1.items[0].client.surname} ${page1.items[0].productCode} @ ${page1.items[0].date.toISOString()}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
