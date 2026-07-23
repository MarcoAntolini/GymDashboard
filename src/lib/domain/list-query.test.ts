import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	DEFAULT_PAGE_SIZE,
	LIST_INDEX_CANDIDATES,
	MAX_PAGE_SIZE,
	PAGE_SIZE_OPTIONS,
	SERVER_TABLE_MANUAL_FLAGS,
	buildListResult,
	listEmptyKind,
	listPageCount,
	listSortFromTanstack,
	normalizeListQuery,
	prismaOrderBy,
	tanstackSortingFromListSort,
	toPrismaSkipTake,
} from "./list-query";

describe("normalizeListQuery", () => {
	it("applies defaults for empty input", () => {
		const q = normalizeListQuery({});
		assert.deepEqual(q.filters, {});
		assert.equal(q.sort, null);
		assert.equal(q.page, 1);
		assert.equal(q.pageSize, DEFAULT_PAGE_SIZE);
		assert.equal(q.skip, 0);
		assert.equal(q.take, DEFAULT_PAGE_SIZE);
	});

	it("clamps page to >= 1 and pageSize into allowed range", () => {
		assert.equal(normalizeListQuery({ page: 0 }).page, 1);
		assert.equal(normalizeListQuery({ page: -3 }).page, 1);
		assert.equal(normalizeListQuery({ pageSize: 0 }).pageSize, DEFAULT_PAGE_SIZE);
		assert.equal(normalizeListQuery({ pageSize: 999 }).pageSize, MAX_PAGE_SIZE);
		assert.equal(normalizeListQuery({ pageSize: 15 }).pageSize, 15);
	});

	it("computes skip/take for LIMIT/OFFSET pagination", () => {
		const q = normalizeListQuery({ page: 3, pageSize: 10 });
		assert.equal(q.skip, 20);
		assert.equal(q.take, 10);
		assert.deepEqual(toPrismaSkipTake(q), { skip: 20, take: 10 });
	});

	it("keeps only non-empty filter values (draft vs applied is a UI concern)", () => {
		const q = normalizeListQuery({
			filters: {
				name: "  Ana  ",
				city: "",
				province: "   ",
				id: 0,
				active: false,
				tags: [],
				okTags: ["a"],
			},
		});
		assert.deepEqual(q.filters, {
			name: "Ana",
			id: 0,
			active: false,
			okTags: ["a"],
		});
	});

	it("rejects sort columns outside the allowlist", () => {
		const q = normalizeListQuery(
			{ sort: { column: "hack", direction: "desc" } },
			{ allowedSortColumns: ["name", "surname"] }
		);
		assert.equal(q.sort, null);
	});

	it("accepts allowlisted sort and normalizes direction", () => {
		const q = normalizeListQuery(
			{ sort: { column: "name", direction: "ASC" as "asc" } },
			{ allowedSortColumns: ["name"], defaultSort: { column: "id", direction: "asc" } }
		);
		assert.deepEqual(q.sort, { column: "name", direction: "asc" });
	});

	it("falls back to defaultSort when sort is missing", () => {
		const q = normalizeListQuery(
			{},
			{ defaultSort: { column: "date", direction: "desc" } }
		);
		assert.deepEqual(q.sort, { column: "date", direction: "desc" });
	});
});

describe("listPageCount / buildListResult", () => {
	it("computes pageCount from total and pageSize", () => {
		assert.equal(listPageCount(0, 20), 0);
		assert.equal(listPageCount(1, 20), 1);
		assert.equal(listPageCount(20, 20), 1);
		assert.equal(listPageCount(21, 20), 2);
	});

	it("builds a reusable ListQueryResult", () => {
		const params = normalizeListQuery({ page: 2, pageSize: 10 });
		const result = buildListResult([{ id: 1 }], 25, params);
		assert.deepEqual(result, {
			rows: [{ id: 1 }],
			total: 25,
			page: 2,
			pageSize: 10,
			pageCount: 3,
		});
	});
});

describe("prismaOrderBy", () => {
	it("maps a single sort to Prisma orderBy", () => {
		assert.deepEqual(prismaOrderBy({ column: "surname", direction: "asc" }), {
			surname: "asc",
		});
	});

	it("uses fallback when sort is null", () => {
		assert.deepEqual(prismaOrderBy(null, { column: "id", direction: "desc" }), {
			id: "desc",
		});
	});

	it("returns undefined when neither sort nor fallback is set", () => {
		assert.equal(prismaOrderBy(null), undefined);
	});
});

describe("listEmptyKind", () => {
	it("distinguishes empty dataset vs empty-from-filters", () => {
		assert.equal(listEmptyKind({ totalUnfiltered: 0, total: 0, rowCount: 0 }), "dataset");
		assert.equal(listEmptyKind({ totalUnfiltered: 10, total: 0, rowCount: 0 }), "filters");
		assert.equal(listEmptyKind({ totalUnfiltered: 10, total: 3, rowCount: 3 }), null);
	});
});

describe("TanStack sort bridge", () => {
	it("maps column sort to DB ORDER BY input (not page-local sort)", () => {
		assert.deepEqual(listSortFromTanstack([{ id: "surname", desc: true }]), {
			column: "surname",
			direction: "desc",
		});
		assert.deepEqual(
			tanstackSortingFromListSort({ column: "name", direction: "asc" }),
			[{ id: "name", desc: false }]
		);
		assert.equal(listSortFromTanstack([]), null);
	});

	it("exposes manual table flags for server lists", () => {
		assert.equal(SERVER_TABLE_MANUAL_FLAGS.manualFiltering, true);
		assert.equal(SERVER_TABLE_MANUAL_FLAGS.manualSorting, true);
		assert.equal(SERVER_TABLE_MANUAL_FLAGS.manualPagination, true);
	});
});

describe("LIST_INDEX_CANDIDATES", () => {
	it("documents candidates aligned with docs/db-guidelines/16-indici.md", () => {
		assert.ok(LIST_INDEX_CANDIDATES.length >= 5);
		const keys = LIST_INDEX_CANDIDATES.map((c) => `${c.entity}:${c.columns.join("+")}`);
		assert.ok(keys.some((k) => k.startsWith("clienti:")));
		assert.ok(keys.some((k) => k.includes("acquisti:")));
		assert.ok(keys.some((k) => k.includes("ingressi:")));
		assert.ok(keys.some((k) => k.includes("pagamenti:")));
		assert.ok(keys.some((k) => k.includes("listino:") || k.includes("listini:")));
		for (const c of LIST_INDEX_CANDIDATES) {
			assert.ok(c.reason.length > 0);
			assert.ok(["present", "candidate", "pk-or-unique"].includes(c.status));
		}
	});

	it("exposes page size options usable by UI pagination", () => {
		assert.ok(PAGE_SIZE_OPTIONS.includes(DEFAULT_PAGE_SIZE as (typeof PAGE_SIZE_OPTIONS)[number]));
		assert.ok(MAX_PAGE_SIZE >= Math.max(...PAGE_SIZE_OPTIONS));
	});
});
