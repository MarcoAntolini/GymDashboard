/**
 * Smoke: lista Abbonamenti server-side (ticket 24) — richiede DB.
 * Run: npx tsx scripts/smoke-list-memberships.ts
 */
import { listMemberships } from "../src/data-access/memberships";
import {
	MEMBERSHIP_DEFAULT_SORT,
	MEMBERSHIP_FILTER_ALLOWLIST,
	MEMBERSHIP_SORT_ALLOWLIST,
} from "../src/lib/list/memberships";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listMemberships({
		page: 1,
		pageSize: 10,
		sort: [...MEMBERSHIP_DEFAULT_SORT],
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
		page1.sort[0]?.id === "productCode" && page1.sort[0]?.desc === false,
		"default sort productCode asc"
	);

	const filtered = await listMemberships({
		filters: { productCode: "__no_such_membership_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(MEMBERSHIP_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byCode = await listMemberships({
			filters: { productCode: sample.productCode },
			page: 1,
			pageSize: 10,
		});
		assert(byCode.total > 0, "productCode filter finds rows");
		assert(
			byCode.items.every((m) => m.productCode.includes(sample.productCode)),
			"productCode filter matches"
		);

		const byDuration = await listMemberships({
			filters: { duration: String(sample.duration) },
			page: 1,
			pageSize: 10,
		});
		assert(byDuration.total > 0, "duration filter finds rows");
		assert(
			byDuration.items.every((m) => m.duration === sample.duration),
			"duration filter exact match"
		);
		assert("product" in sample, "include product");
	}

	const badSort = await listMemberships({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(MEMBERSHIP_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "productCode", "fallback to default sort");

	const durationSort = await listMemberships({
		sort: [{ id: "duration", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(durationSort.sort[0]?.id === "duration", "duration sort allowed");
	assert(durationSort.sort[0]?.desc === true, "duration sort desc");
	if (durationSort.items.length >= 2) {
		assert(
			durationSort.items[0].duration >= durationSort.items[1].duration,
			"duration desc order"
		);
	}

	if (page1.total > 10) {
		const page2 = await listMemberships({
			page: 2,
			pageSize: 10,
			sort: [...MEMBERSHIP_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const codes1 = new Set(page1.items.map((m) => m.productCode));
		assert(
			page2.items.every((m) => !codes1.has(m.productCode)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-memberships: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0] ? page1.items[0].productCode : "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
