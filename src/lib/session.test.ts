import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createSessionValue, signSessionValue, verifySessionValue } from "./session";

describe("session role payload", () => {
	it("round-trips username and role", async () => {
		const now = 1_700_000_000;
		const { payloadB64, payload } = createSessionValue("mario", "Employee", now);
		assert.equal(payload.u, "mario");
		assert.equal(payload.r, "Employee");
		const signed = await signSessionValue(payloadB64);
		const verified = await verifySessionValue(signed, now);
		assert.deepEqual(verified, payload);
	});

	it("rejects payload without a valid role", async () => {
		const now = 1_700_000_000;
		const { payloadB64 } = createSessionValue("admin", "Admin", now);
		// Tamper: re-sign a payload missing r (simulate legacy cookie)
		const legacyJson = JSON.stringify({ u: "admin", exp: now + 3600 });
		const legacyB64 = Buffer.from(legacyJson, "utf8")
			.toString("base64")
			.replace(/\+/g, "-")
			.replace(/\//g, "_")
			.replace(/=+$/g, "");
		const signedLegacy = await signSessionValue(legacyB64);
		assert.equal(await verifySessionValue(signedLegacy, now), null);
		// Original still verifies
		assert.ok(await verifySessionValue(await signSessionValue(payloadB64), now));
	});
});
