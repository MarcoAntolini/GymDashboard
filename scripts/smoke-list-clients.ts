/**
 * Smoke: lista Clienti server-side (ticket 20) — richiede DB.
 * Run: npx tsx scripts/smoke-list-clients.ts
 */
import { listClients } from "../src/data-access/clients";
import {
	CLIENT_DEFAULT_SORT,
	CLIENT_FILTER_ALLOWLIST,
	CLIENT_SORT_ALLOWLIST,
} from "../src/lib/list/clients";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listClients({
		page: 1,
		pageSize: 10,
		sort: [...CLIENT_DEFAULT_SORT],
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
		page1.sort[0]?.id === "surname" && page1.sort[0]?.desc === false,
		"default sort surname asc"
	);
	assert(page1.sort[1]?.id === "name", "default sort name secondary");

	const filtered = await listClients({
		filters: { surname: "__no_such_client_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(CLIENT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listClients({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(CLIENT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.total > 10) {
		const page2 = await listClients({
			page: 2,
			pageSize: 10,
			sort: [...CLIENT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((c) => c.id));
		assert(
			page2.items.every((c) => !ids1.has(c.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-clients: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]
			? `${page1.items[0].surname} ${page1.items[0].name}`
			: "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
