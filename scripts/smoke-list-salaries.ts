/**
 * Smoke: lista Stipendi server-side (ticket 31) — richiede DB.
 * Run: npx tsx scripts/smoke-list-salaries.ts
 */
import { listSalaries } from "../src/data-access/salaries";
import {
	SALARY_DEFAULT_SORT,
	SALARY_FILTER_ALLOWLIST,
	SALARY_SORT_ALLOWLIST,
} from "../src/lib/list/salaries";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listSalaries({
		page: 1,
		pageSize: 10,
		sort: [...SALARY_DEFAULT_SORT],
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

	const filtered = await listSalaries({
		filters: { employeeId: "999999999" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(SALARY_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listSalaries({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(SALARY_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleEmployeeId = page1.items[0].employeeId;
		const byEmployee = await listSalaries({
			filters: { employeeId: String(sampleEmployeeId) },
			page: 1,
			pageSize: 10,
		});
		assert(byEmployee.total >= 1, "employeeId filter matches sample");
		assert(
			byEmployee.items.every((s) => s.employeeId === sampleEmployeeId),
			"employeeId exact filter"
		);

		const samplePaymentId = page1.items[0].paymentId;
		const byPayment = await listSalaries({
			filters: { paymentId: String(samplePaymentId) },
			page: 1,
			pageSize: 10,
		});
		assert(byPayment.total === 1, "paymentId filter matches sample");
		assert(
			byPayment.items.every((s) => s.paymentId === samplePaymentId),
			"paymentId exact filter"
		);
	}

	if (page1.total > 10) {
		const page2 = await listSalaries({
			page: 2,
			pageSize: 10,
			sort: [...SALARY_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const ids1 = new Set(page1.items.map((s) => s.paymentId));
		assert(
			page2.items.every((s) => !ids1.has(s.paymentId)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-salaries: OK", {
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
