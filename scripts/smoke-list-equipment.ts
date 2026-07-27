/**
 * Smoke: lista Attrezzatura server-side (ticket 33) — richiede DB.
 * Run: npx tsx scripts/smoke-list-equipment.ts
 */
import { listEquipment } from "../src/data-access/equipment";
import {
	EQUIPMENT_DEFAULT_SORT,
	EQUIPMENT_FILTER_ALLOWLIST,
	EQUIPMENT_SORT_ALLOWLIST,
} from "../src/lib/list/equipment";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listEquipment({
		page: 1,
		pageSize: 10,
		sort: [...EQUIPMENT_DEFAULT_SORT],
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

	const filtered = await listEquipment({
		filters: { provider: "__no_such_provider_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(EQUIPMENT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listEquipment({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(EQUIPMENT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleProvider = page1.items[0].provider;
		const byProvider = await listEquipment({
			filters: { provider: sampleProvider },
			page: 1,
			pageSize: 10,
		});
		assert(byProvider.total >= 1, "provider filter matches sample");
		assert(
			byProvider.items.every((e) => e.provider.includes(sampleProvider)),
			"provider contains filter"
		);

		const samplePaymentId = page1.items[0].paymentId;
		const byPayment = await listEquipment({
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
		const page2 = await listEquipment({
			page: 2,
			pageSize: 10,
			sort: [...EQUIPMENT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((e) => e.paymentId));
		assert(
			page2.items.every((e) => !ids1.has(e.paymentId)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-equipment: OK", {
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
