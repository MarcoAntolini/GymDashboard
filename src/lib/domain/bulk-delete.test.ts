import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { runBulkDeletes } from "@/lib/domain/bulk-delete";

describe("runBulkDeletes", () => {
	it("counts successes and collects Restrict-style errors without aborting", async () => {
		const rows = [1, 2, 3];
		const result = await runBulkDeletes(rows, async (id) => {
			if (id === 2) throw new Error("Cliente ha Acquisti collegati");
		});
		assert.equal(result.ok, 2);
		assert.deepEqual(result.errors, ["Cliente ha Acquisti collegati"]);
	});

	it("returns all ok when every delete succeeds", async () => {
		const result = await runBulkDeletes(["a", "b"], async () => undefined);
		assert.equal(result.ok, 2);
		assert.deepEqual(result.errors, []);
	});
});
