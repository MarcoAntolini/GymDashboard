/**
 * Smoke: lista Ingressi server-side (ticket 21) — richiede DB.
 * Run: npx tsx scripts/smoke-list-entrances.ts
 */
import { listEntrances } from "../src/data-access/entrances";
import {
	ENTRANCE_DEFAULT_SORT,
	ENTRANCE_FILTER_ALLOWLIST,
	ENTRANCE_SORT_ALLOWLIST,
} from "../src/lib/list/entrances";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listEntrances({
		page: 1,
		pageSize: 10,
		sort: [...ENTRANCE_DEFAULT_SORT],
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

	const filtered = await listEntrances({
		filters: { client: "__no_such_client_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(ENTRANCE_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listEntrances({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(ENTRANCE_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "date", "fallback to default sort");

	const byClient = await listEntrances({
		sort: [{ id: "client", desc: false }],
		page: 1,
		pageSize: 10,
	});
	assert(byClient.sort[0]?.id === "client", "join sort client accepted");

	if (page1.total > 10) {
		const page2 = await listEntrances({
			page: 2,
			pageSize: 10,
			sort: [...ENTRANCE_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((e) => e.id));
		assert(
			page2.items.every((e) => !ids1.has(e.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-entrances: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `${page1.items[0].purchase.client.surname} @ ${page1.items[0].date.toISOString()}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
