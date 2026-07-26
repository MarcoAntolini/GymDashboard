/**
 * Smoke: lista Acquisti server-side (ticket 22) — richiede DB.
 * Run: npx tsx scripts/smoke-list-purchases.ts
 */
import { listPurchases } from "../src/data-access/purchases";
import {
	PURCHASE_DEFAULT_SORT,
	PURCHASE_FILTER_ALLOWLIST,
	PURCHASE_SORT_ALLOWLIST,
} from "../src/lib/list/purchases";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listPurchases({
		page: 1,
		pageSize: 10,
		sort: [...PURCHASE_DEFAULT_SORT],
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

	const filtered = await listPurchases({
		filters: { client: "__no_such_client_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(PURCHASE_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byClientId = await listPurchases({
			filters: { clientId: String(sample.clientId) },
			page: 1,
			pageSize: 10,
		});
		assert(byClientId.total > 0, "clientId filter finds rows");
		assert(
			byClientId.items.every((p) => p.clientId === sample.clientId),
			"clientId filter matches Cliente column"
		);

		const byPurchaseId = await listPurchases({
			filters: { id: String(sample.id) },
			page: 1,
			pageSize: 10,
		});
		assert(byPurchaseId.total === 1, "id filter → single purchase");
		assert(byPurchaseId.items[0]?.id === sample.id, "id filter exact");

		const byProduct = await listPurchases({
			filters: { productCode: sample.productCode },
			page: 1,
			pageSize: 10,
		});
		assert(byProduct.total > 0, "productCode filter finds rows");
		assert(
			byProduct.items.every((p) => p.productCode.includes(sample.productCode)),
			"productCode filter matches"
		);

		const clientIdAsPurchaseId = await listPurchases({
			filters: { id: String(sample.clientId) },
			page: 1,
			pageSize: 10,
		});
		assert(
			clientIdAsPurchaseId.items.every((p) => p.id === sample.clientId),
			"id does not silently match clientId"
		);
	}

	const badSort = await listPurchases({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(PURCHASE_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "date", "fallback to default sort");

	const byClient = await listPurchases({
		sort: [{ id: "client", desc: false }],
		page: 1,
		pageSize: 10,
	});
	assert(byClient.sort[0]?.id === "client", "join sort client accepted");

	const byAmount = await listPurchases({
		sort: [{ id: "amount", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(byAmount.sort[0]?.id === "amount", "snapshot sort amount accepted");

	if (page1.total > 10) {
		const page2 = await listPurchases({
			page: 2,
			pageSize: 10,
			sort: [...PURCHASE_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((p) => p.id));
		assert(
			page2.items.every((p) => !ids1.has(p.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-purchases: OK", {
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
