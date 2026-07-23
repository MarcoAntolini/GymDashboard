import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maskSecret } from "./password-mask";

describe("maskSecret", () => {
	it("returns length-preserving bullets for a non-empty secret", () => {
		assert.equal(maskSecret("secret12"), "••••••••");
		assert.equal(maskSecret("ab"), "••");
	});

	it("never includes plaintext characters", () => {
		const secret = "P@ssw0rd!";
		const masked = maskSecret(secret);
		assert.equal(masked.includes("P"), false);
		assert.equal(masked.includes("@"), false);
		assert.equal(masked.includes("0"), false);
		assert.equal(masked, "•".repeat(secret.length));
	});

	it("uses a fixed mask for empty values", () => {
		assert.equal(maskSecret(""), "••••••••");
	});
});
