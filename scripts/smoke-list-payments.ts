/**
 * Smoke: lista Pagamenti server-side (ticket 35) — richiede DB.
 * Run: npx tsx scripts/smoke-list-payments.ts
 */
import { listPayments } from "../src/data-access/payments";
import {
	PAYMENT_DEFAULT_SORT,
	PAYMENT_FILTER_ALLOWLIST,
	PAYMENT_SORT_ALLOWLIST,
} from "../src/lib/list/payments";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listPayments({
		page: 1,
		pageSize: 10,
		sort: [...PAYMENT_DEFAULT_SORT],
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

	const invalidType = await listPayments({
		filters: { type: "__no_such_type_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(invalidType.total === page1.total, "invalid type ignored in WHERE");
	assert(
		Object.keys(invalidType.filters).every((k) =>
			(PAYMENT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const unmatchedId = await listPayments({
		filters: { id: "999999999" },
		page: 1,
		pageSize: 10,
	});
	assert(unmatchedId.total === 0, "unmatched id → total 0");
	assert(unmatchedId.items.length === 0, "unmatched id → no items");

	const badSort = await listPayments({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(PAYMENT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleType = page1.items[0].type;
		const byType = await listPayments({
			filters: { type: sampleType },
			page: 1,
			pageSize: 10,
		});
		assert(byType.total >= 1, "type filter matches sample");
		assert(
			byType.items.every((p) => p.type === sampleType),
			"type exact filter"
		);

		const sampleId = page1.items[0].id;
		const byId = await listPayments({
			filters: { id: String(sampleId) },
			page: 1,
			pageSize: 10,
		});
		assert(byId.total === 1, "id filter matches sample");
		assert(
			byId.items.every((p) => p.id === sampleId),
			"id exact filter"
		);
	}

	const withBill = page1.items.find((p) => p.bill?.provider);
	if (withBill?.bill) {
		const needle = withBill.bill.provider.slice(0, Math.min(4, withBill.bill.provider.length));
		if (needle) {
			const byDetail = await listPayments({
				filters: { specialization: needle },
				page: 1,
				pageSize: 10,
			});
			assert(byDetail.total >= 1, "specialization filter matches sample");
			assert(
				byDetail.items.some((p) => p.id === withBill.id),
				"specialization filter includes sample row"
			);
		}
	}

	const unmatchedDetail = await listPayments({
		filters: { specialization: "__no_such_detail_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(unmatchedDetail.total === 0, "unmatched specialization → total 0");

	if (page1.total > 10) {
		const page2 = await listPayments({
			page: 2,
			pageSize: 10,
			sort: [...PAYMENT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((p) => p.id));
		assert(
			page2.items.every((p) => !ids1.has(p.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-payments: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `id=${page1.items[0].id} type=${page1.items[0].type}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
