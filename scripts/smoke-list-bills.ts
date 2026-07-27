/**
 * Smoke: lista Bollette server-side (ticket 32) — richiede DB.
 * Run: npx tsx scripts/smoke-list-bills.ts
 */
import { listBills } from "../src/data-access/bills";
import {
	BILL_DEFAULT_SORT,
	BILL_FILTER_ALLOWLIST,
	BILL_SORT_ALLOWLIST,
} from "../src/lib/list/bills";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listBills({
		page: 1,
		pageSize: 10,
		sort: [...BILL_DEFAULT_SORT],
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
		page1.sort[0]?.id === "paymentId" && page1.sort[0]?.desc === true,
		"default sort paymentId desc"
	);

	const filtered = await listBills({
		filters: { provider: "__no_such_provider_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(BILL_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listBills({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(BILL_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleProvider = page1.items[0].provider;
		const byProvider = await listBills({
			filters: { provider: sampleProvider },
			page: 1,
			pageSize: 10,
		});
		assert(byProvider.total >= 1, "provider filter matches sample");
		assert(
			byProvider.items.every((b) => b.provider.includes(sampleProvider)),
			"provider contains filter"
		);

		const samplePaymentId = page1.items[0].paymentId;
		const byPayment = await listBills({
			filters: { paymentId: String(samplePaymentId) },
			page: 1,
			pageSize: 10,
		});
		assert(byPayment.total === 1, "paymentId filter matches sample");
		assert(
			byPayment.items.every((b) => b.paymentId === samplePaymentId),
			"paymentId exact filter"
		);
	}

	if (page1.total > 10) {
		const page2 = await listBills({
			page: 2,
			pageSize: 10,
			sort: [...BILL_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((b) => b.paymentId));
		assert(
			page2.items.every((b) => !ids1.has(b.paymentId)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-bills: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `paymentId=${page1.items[0].paymentId}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
