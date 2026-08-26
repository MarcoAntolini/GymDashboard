/**
 * Smoke: lista Dipendenti server-side (ticket 27) — richiede DB.
 * Run: npx tsx scripts/smoke-list-employees.ts
 */
import { listEmployees } from "../src/data-access/employees";
import {
	EMPLOYEE_DEFAULT_SORT,
	EMPLOYEE_FILTER_ALLOWLIST,
	EMPLOYEE_SORT_ALLOWLIST,
} from "../src/lib/list/employees";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listEmployees({
		page: 1,
		pageSize: 10,
		sort: [...EMPLOYEE_DEFAULT_SORT],
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
		page1.sort[0]?.id === "id" && page1.sort[0]?.desc === false,
		"default sort id asc"
	);
	assert(page1.sort.length === 1, "default sort is a single column");

	const filtered = await listEmployees({
		filters: { surname: "__no_such_employee_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(EMPLOYEE_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listEmployees({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(EMPLOYEE_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]?.city) {
		const byCity = await listEmployees({
			filters: { city: page1.items[0].city },
			page: 1,
			pageSize: 10,
		});
		assert(byCity.total >= 1, "city filter matches sample");
		assert(
			byCity.items.every((e) =>
				e.city.toLowerCase().includes(page1.items[0].city.toLowerCase())
			),
			"city contains filter"
		);
	}

	if (page1.total > 10) {
		const page2 = await listEmployees({
			page: 2,
			pageSize: 10,
			sort: [...EMPLOYEE_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((e) => e.id));
		assert(
			page2.items.every((e) => !ids1.has(e.id)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-employees: OK", {
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
