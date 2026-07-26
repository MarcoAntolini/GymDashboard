/**
 * Smoke: lista Contratti server-side (ticket 29) — richiede DB.
 * Run: npx tsx scripts/smoke-list-contracts.ts
 */
import { listContracts } from "../src/data-access/contracts";
import {
	CONTRACT_DEFAULT_SORT,
	CONTRACT_FILTER_ALLOWLIST,
	CONTRACT_SORT_ALLOWLIST,
} from "../src/lib/list/contracts";
import { ContractType } from "@prisma/client";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

function contractKey(c: { employeeId: number; startingDate: Date }) {
	return `${c.employeeId}|${c.startingDate.toISOString()}`;
}

async function main() {
	const page1 = await listContracts({
		page: 1,
		pageSize: 10,
		sort: [...CONTRACT_DEFAULT_SORT],
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
		page1.sort[0]?.id === "employeeId" && page1.sort[0]?.desc === false,
		"default sort employeeId asc"
	);

	const filtered = await listContracts({
		filters: { employeeId: "999999999" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(CONTRACT_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	const badSort = await listContracts({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(CONTRACT_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);

	if (page1.items[0]) {
		const sampleId = page1.items[0].employeeId;
		const byEmployee = await listContracts({
			filters: { employeeId: String(sampleId) },
			page: 1,
			pageSize: 10,
		});
		assert(byEmployee.total >= 1, "employeeId filter matches sample");
		assert(
			byEmployee.items.every((c) => c.employeeId === sampleId),
			"employeeId exact filter"
		);
	}

	const byType = await listContracts({
		filters: { type: ContractType.FixedTerm },
		page: 1,
		pageSize: 10,
	});
	assert(
		byType.items.every((c) => c.type === ContractType.FixedTerm),
		"type exact filter"
	);

	if (page1.total > 10) {
		const page2 = await listContracts({
			page: 2,
			pageSize: 10,
			sort: [...CONTRACT_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const keys1 = new Set(page1.items.map(contractKey));
		assert(
			page2.items.every((c) => !keys1.has(contractKey(c))),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-contracts: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0] ? contractKey(page1.items[0]) : "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
