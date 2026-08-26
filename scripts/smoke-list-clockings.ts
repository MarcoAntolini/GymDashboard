/**
 * Smoke: lista Timbrature server-side (ticket 30) — richiede DB.
 * Run: npx tsx scripts/smoke-list-clockings.ts
 */
import { listClockings } from "../src/data-access/clockings";
import { formatFilterDay } from "../src/lib/list";
import {
	CLOCKING_DEFAULT_SORT,
	CLOCKING_FILTER_ALLOWLIST,
	CLOCKING_SORT_ALLOWLIST,
} from "../src/lib/list/clockings";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

function clockingKey(c: { employeeId: number; entranceTime: Date }) {
	return `${c.employeeId}|${c.entranceTime.toISOString()}`;
}

async function main() {
	const page1 = await listClockings({
		page: 1,
		pageSize: 10,
		sort: [...CLOCKING_DEFAULT_SORT],
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
		page1.sort[0]?.id === "entranceTime" && page1.sort[0]?.desc === true,
		"default sort entranceTime desc"
	);

	const filtered = await listClockings({
		filters: { employeeId: "999999999" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(CLOCKING_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listClockings({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(CLOCKING_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleId = page1.items[0].employeeId;
		const byEmployee = await listClockings({
			filters: { employeeId: String(sampleId) },
			page: 1,
			pageSize: 10,
		});
		assert(byEmployee.total >= 1, "employeeId filter matches sample");
		assert(
			byEmployee.items.every((c) => c.employeeId === sampleId),
			"employeeId exact filter"
		);

		const localDay = formatFilterDay(page1.items[0].entranceTime);
		const byDay = await listClockings({
			filters: { date: localDay },
			page: 1,
			pageSize: 50,
		});
		assert(byDay.total > 0, "date filter finds rows");
		assert(
			byDay.items.every((c) => formatFilterDay(c.entranceTime) === localDay),
			"date filter matches calendar day of entranceTime"
		);
	}

	if (page1.total > 10) {
		const page2 = await listClockings({
			page: 2,
			pageSize: 10,
			sort: [...CLOCKING_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const keys1 = new Set(page1.items.map(clockingKey));
		assert(
			page2.items.every((c) => !keys1.has(clockingKey(c))),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-clockings: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0] ? clockingKey(page1.items[0]) : "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
