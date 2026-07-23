import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "./password";

describe("hashPassword / verifyPassword", () => {
	it("hashes and verifies a matching password", async () => {
		const hash = await hashPassword("Password1");
		assert.notEqual(hash, "Password1");
		assert.equal(await verifyPassword("Password1", hash), true);
	});

	it("rejects a wrong password", async () => {
		const hash = await hashPassword("Password1");
		assert.equal(await verifyPassword("WrongPass1", hash), false);
	});
});
