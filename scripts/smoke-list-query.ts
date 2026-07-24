/**
 * Smoke: contratto liste server-side (ticket 19) — pure helpers, no DB.
 * Run: npx tsx scripts/smoke-list-query.ts
 */
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	toPrismaPage,
} from "../src/lib/list";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

const q = normalizeListQuery(
	{
		filters: { name: "  ", surname: "Rossi", hack: "x" },
		sort: [{ id: "surname" }, { id: "dropTable" }, { id: "surname" }],
		page: 0,
		pageSize: 99,
	},
	{
		sortAllowlist: ["surname", "name"],
		filterAllowlist: ["name", "surname"],
		defaultSort: [{ id: "name", desc: false }],
		defaultPageSize: 10,
	}
);

assert(q.page === 1, "page clamped to ≥ 1");
assert(q.pageSize === 10, "invalid pageSize → default");
assert(Object.keys(q.filters).length === 1 && q.filters.surname === "Rossi", "filters allowlist + empty strip");
assert(q.sort.length === 1 && q.sort[0].id === "surname", "sort allowlist + dedupe");

const { skip, take, orderBy } = toPrismaListArgs({
	...q,
	page: 3,
	pageSize: 20,
});
assert(skip === 40 && take === 20, "skip/take from 1-based page");
assert(orderBy?.[0]?.surname === "asc", "orderBy asc");

const page = toPrismaPage({ page: 1, pageSize: 10 });
assert(page.skip === 0 && page.take === 10, "first page skip 0");

const result = buildListResult([{ id: 1 }], 25, {
	filters: {},
	sort: [],
	page: 1,
	pageSize: 10,
});
assert(result.pageCount === 3 && result.total === 25, "pageCount from total");

console.log("smoke-list-query: ok");
