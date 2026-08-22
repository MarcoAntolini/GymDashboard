/**
 * Smoke: lista Account server-side (ticket 28) — richiede DB.
 * Run: npx tsx scripts/smoke-list-accounts.ts
 */
import { Role } from "@prisma/client";
import { listAccounts } from "../src/data-access/accounts";
import {
	ACCOUNT_DEFAULT_SORT,
	ACCOUNT_FILTER_ALLOWLIST,
	ACCOUNT_SORT_ALLOWLIST,
} from "../src/lib/list/accounts";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listAccounts({
		page: 1,
		pageSize: 10,
		sort: [...ACCOUNT_DEFAULT_SORT],
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
		page1.sort[0]?.id === "username" && page1.sort[0]?.desc === false,
		"default sort username asc"
	);

	const filtered = await listAccounts({
		filters: { username: "__no_such_account_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(ACCOUNT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listAccounts({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(ACCOUNT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]?.username) {
		const sample = page1.items[0].username.slice(0, Math.min(3, page1.items[0].username.length));
		const byUsername = await listAccounts({
			filters: { username: sample },
			page: 1,
			pageSize: 10,
		});
		assert(byUsername.total >= 1, "username filter matches sample");
		assert(
			byUsername.items.every((a) =>
				a.username.toLowerCase().includes(sample.toLowerCase())
			),
			"username contains filter"
		);
	}

	const byRole = await listAccounts({
		filters: { role: "Employee" },
		page: 1,
		pageSize: 10,
	});
	assert(
		byRole.items.every((a) => a.role === Role.Employee),
		"role exact filter"
	);

	const byApproved = await listAccounts({
		filters: { approved: "false" },
		page: 1,
		pageSize: 10,
	});
	assert(
		byApproved.items.every((a) => a.approved === false),
		"approved exact filter"
	);

	if (page1.total > 10) {
		const page2 = await listAccounts({
			page: 2,
			pageSize: 10,
			sort: [...ACCOUNT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const keys1 = new Set(page1.items.map((a) => a.username));
		assert(
			page2.items.every((a) => !keys1.has(a.username)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-accounts: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0]?.username ?? "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
