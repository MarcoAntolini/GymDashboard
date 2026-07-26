/**
 * Smoke: lista Pacchetti ingressi server-side (ticket 25) — richiede DB.
 * Run: npx tsx scripts/smoke-list-entrance-sets.ts
 */
import { listEntranceSets } from "../src/data-access/entranceSets";
import {
	ENTRANCE_SET_DEFAULT_SORT,
	ENTRANCE_SET_FILTER_ALLOWLIST,
	ENTRANCE_SET_SORT_ALLOWLIST,
} from "../src/lib/list/entranceSets";

function assert(cond: unknown, msg: string): asserts cond {
	if (!cond) throw new Error(msg);
}

async function main() {
	const page1 = await listEntranceSets({
		page: 1,
		pageSize: 10,
		sort: [...ENTRANCE_SET_DEFAULT_SORT],
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

	const filtered = await listEntranceSets({
		filters: { productCode: "__no_such_entrance_set_zzz__" },
		page: 1,
		pageSize: 10,
	});
	assert(filtered.total === 0, "unmatched filter → total 0");
	assert(filtered.items.length === 0, "unmatched filter → no items");
	assert(
		Object.keys(filtered.filters).every((k) =>
			(ENTRANCE_SET_FILTER_ALLOWLIST as readonly string[]).includes(k)
		),
		"filters allowlist"
	);

	if (page1.items[0]) {
		const sample = page1.items[0];
		const byCode = await listEntranceSets({
			filters: { productCode: sample.productCode },
			page: 1,
			pageSize: 10,
		});
		assert(byCode.total > 0, "productCode filter finds rows");
		assert(
			byCode.items.every((m) => m.productCode.includes(sample.productCode)),
			"productCode filter matches"
		);

		const byEntranceNumber = await listEntranceSets({
			filters: { entranceNumber: String(sample.entranceNumber) },
			page: 1,
			pageSize: 10,
		});
		assert(byEntranceNumber.total > 0, "entranceNumber filter finds rows");
		assert(
			byEntranceNumber.items.every(
				(m) => m.entranceNumber === sample.entranceNumber
			),
			"entranceNumber filter exact match"
		);
		assert("product" in sample, "include product");
	}

	const badSort = await listEntranceSets({
		sort: [{ id: "dropTable", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		badSort.sort.every((s) =>
			(ENTRANCE_SET_SORT_ALLOWLIST as readonly string[]).includes(s.id)
		),
		"sort allowlist strips injection"
	);
	assert(badSort.sort[0]?.id === "productCode", "fallback to default sort");

	const entranceNumberSort = await listEntranceSets({
		sort: [{ id: "entranceNumber", desc: true }],
		page: 1,
		pageSize: 10,
	});
	assert(
		entranceNumberSort.sort[0]?.id === "entranceNumber",
		"entranceNumber sort allowed"
	);
	assert(entranceNumberSort.sort[0]?.desc === true, "entranceNumber sort desc");
	if (entranceNumberSort.items.length >= 2) {
		assert(
			entranceNumberSort.items[0].entranceNumber >=
				entranceNumberSort.items[1].entranceNumber,
			"entranceNumber desc order"
		);
	}

	if (page1.total > 10) {
		const page2 = await listEntranceSets({
			page: 2,
			pageSize: 10,
			sort: [...ENTRANCE_SET_DEFAULT_SORT],
		});
		assert(page2.page === 2, "page 2");
		assert(page2.items.length > 0, "page 2 has rows when total > 10");
		const codes1 = new Set(page1.items.map((m) => m.productCode));
		assert(
			page2.items.every((m) => !codes1.has(m.productCode)),
			"pages do not overlap"
		);
	}

	console.log("smoke-list-entrance-sets: OK", {
		total: page1.total,
		pageCount: page1.pageCount,
		sample: page1.items[0] ? page1.items[0].productCode : "(empty)",
	});
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
