import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { normalizeListQuery, runListQuery } from "./list-query";

describe("runListQuery", () => {
	it("normalizes input, delegates to runner, and returns ListQueryResult", async () => {
		const seen: unknown[] = [];
		const result = await runListQuery(
			{ page: 2, pageSize: 10, filters: { name: "Ada" } },
			async (params) => {
				seen.push(params);
				return { rows: [{ id: 11 }], total: 21 };
			}
		);

		assert.equal(seen.length, 1);
		const params = seen[0] as ReturnType<typeof normalizeListQuery>;
		assert.equal(params.page, 2);
		assert.equal(params.skip, 10);
		assert.equal(params.take, 10);
		assert.deepEqual(params.filters, { name: "Ada" });
		assert.deepEqual(result, {
			rows: [{ id: 11 }],
			total: 21,
			page: 2,
			pageSize: 10,
			pageCount: 3,
		});
	});
});
