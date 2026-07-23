import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	deriveProductKind,
	productMatchesKind,
} from "./product-kind";

describe("deriveProductKind", () => {
	it("returns Membership when only membership is set", () => {
		assert.equal(
			deriveProductKind({ membership: { duration: 30 }, entranceSet: null }),
			"Membership"
		);
	});

	it("returns EntranceSet when only entranceSet is set", () => {
		assert.equal(
			deriveProductKind({ membership: null, entranceSet: { entranceNumber: 10 } }),
			"EntranceSet"
		);
	});

	it("returns null when neither specialization is set", () => {
		assert.equal(deriveProductKind({ membership: null, entranceSet: null }), null);
	});

	it("returns null when both specializations are set", () => {
		assert.equal(
			deriveProductKind({
				membership: { duration: 30 },
				entranceSet: { entranceNumber: 10 },
			}),
			null
		);
	});
});

describe("productMatchesKind", () => {
	it("filters membership products for Membership kind", () => {
		const product = { membership: { duration: 30 }, entranceSet: null };
		assert.equal(productMatchesKind(product, "Membership"), true);
		assert.equal(productMatchesKind(product, "EntranceSet"), false);
	});
});
