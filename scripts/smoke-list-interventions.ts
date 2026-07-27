/**
 * Smoke: lista Interventi server-side (ticket 34) — richiede DB.
 * Run: npx tsx scripts/smoke-list-interventions.ts
 */
import { listInterventions } from "../src/data-access/interventions";
import {
	INTERVENTION_DEFAULT_SORT,
	INTERVENTION_FILTER_ALLOWLIST,
	INTERVENTION_SORT_ALLOWLIST,
} from "../src/lib/list/interventions";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listInterventions({
		page: 1,
		pageSize: 10,
		sort: [...INTERVENTION_DEFAULT_SORT],
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

	const filtered = await listInterventions({
		filters: { maker: "__no_such_maker_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(INTERVENTION_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listInterventions({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(INTERVENTION_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleMaker = page1.items[0].maker;
		const byMaker = await listInterventions({
			filters: { maker: sampleMaker },
			page: 1,
			pageSize: 10,
		});
		assert(byMaker.total >= 1, "maker filter matches sample");
		assert(
			byMaker.items.every((e) => e.maker.includes(sampleMaker)),
			"maker contains filter"
		);

		const samplePaymentId = page1.items[0].paymentId;
		const byPayment = await listInterventions({
			filters: { paymentId: String(samplePaymentId) },
			page: 1,
			pageSize: 10,
		});
		assert(byPayment.total === 1, "paymentId filter matches sample");
		assert(
			byPayment.items.every((e) => e.paymentId === samplePaymentId),
			"paymentId exact filter"
		);
	}

	if (page1.total > 10) {
		const page2 = await listInterventions({
			page: 2,
			pageSize: 10,
			sort: [...INTERVENTION_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((e) => e.paymentId));
		assert(
			page2.items.every((e) => !ids1.has(e.paymentId)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-interventions: OK", {
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
