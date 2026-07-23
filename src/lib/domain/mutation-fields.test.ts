import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	MUTATION_EDGE_CASES,
	MUTATION_FIELD_MATRIX,
	MutationAllowlistError,
	allowedMutationKeys,
	assertAllowedMutation,
	isFlagged,
	mutationEntities,
	mutationFieldSpec,
} from "./mutation-fields";
import { VIEW_ENTITIES } from "./view-columns";

describe("MUTATION_FIELD_MATRIX", () => {
	it("covers every view entity", () => {
		for (const entity of VIEW_ENTITIES) {
			assert.ok(
				MUTATION_FIELD_MATRIX[entity].length > 0,
				`expected mutation fields for ${entity}`
			);
		}
		assert.deepEqual([...mutationEntities()], [...VIEW_ENTITIES]);
	});

	it("marks join/derivata-style Acquisto fields immutable", () => {
		assert.equal(isFlagged("acquisti", "remainingEntrances", "immutable"), true);
		assert.equal(isFlagged("acquisti", "client", "immutable"), true);
		assert.equal(isFlagged("acquisti", "duration", "immutable"), true);
		assert.equal(isFlagged("acquisti", "entranceNumber", "immutable"), true);
	});

	it("allows Acquisto amount/productCode only on create", () => {
		assert.deepEqual(
			allowedMutationKeys("acquisti", "create").sort(),
			["amount", "clientId", "date", "productCode"].sort()
		);
		assert.deepEqual(
			allowedMutationKeys("acquisti", "update").sort(),
			["clientId", "date", "id"].sort()
		);
	});

	it("marks Account password write-only and role/approved admin-only", () => {
		assert.equal(isFlagged("account", "password", "write-only"), true);
		assert.equal(isFlagged("account", "role", "admin-only"), true);
		assert.equal(isFlagged("account", "approved", "admin-only"), true);
		assert.ok(!allowedMutationKeys("account", "update").includes("password"));
		assert.ok(!allowedMutationKeys("account", "create").includes("role"));
	});

	it("documents Contratto endingDate as create+update", () => {
		const ending = mutationFieldSpec("contratti", "endingDate");
		assert.ok(ending?.flags.includes("create"));
		assert.ok(ending?.flags.includes("update"));
		assert.ok(ending?.notes?.toLowerCase().includes("openended"));
	});

	it("documents the three required edge cases", () => {
		const ids = MUTATION_EDGE_CASES.map((c) => c.id).sort();
		assert.deepEqual(ids, [
			"account-password",
			"acquisto-cambio-prodotto",
			"contratto-data-fine",
		]);
	});
});

describe("assertAllowedMutation", () => {
	it("accepts an allowlisted create payload", () => {
		const payload = {
			clientId: 1,
			date: new Date(),
			productCode: "M1",
			amount: "10.00",
		};
		assert.equal(assertAllowedMutation("acquisti", "create", payload), payload);
	});

	it("rejects derivata/join keys on update", () => {
		assert.throws(
			() =>
				assertAllowedMutation("acquisti", "update", {
					id: 1,
					clientId: 1,
					date: new Date(),
					remainingEntrances: 3,
				}),
			(err: unknown) => {
				assert.ok(err instanceof MutationAllowlistError);
				assert.ok(err.disallowedKeys.includes("remainingEntrances"));
				return true;
			}
		);
	});

	it("rejects snapshot productCode/amount on Acquisto update", () => {
		assert.throws(
			() =>
				assertAllowedMutation("acquisti", "update", {
					id: 1,
					clientId: 1,
					date: new Date(),
					productCode: "OTHER",
					amount: "99.00",
				}),
			(err: unknown) => {
				assert.ok(err instanceof MutationAllowlistError);
				assert.ok(err.disallowedKeys.includes("productCode"));
				assert.ok(err.disallowedKeys.includes("amount"));
				return true;
			}
		);
	});

	it("rejects password on Account update", () => {
		assert.throws(
			() =>
				assertAllowedMutation("account", "update", {
					employeeId: 1,
					role: "Admin",
					approved: true,
					password: "secret",
				}),
			MutationAllowlistError
		);
	});

	it("rejects remainingEntrances on Cliente create", () => {
		assert.throws(
			() =>
				assertAllowedMutation("clienti", "create", {
					taxCode: "X",
					name: "A",
					surname: "B",
					birthDate: new Date(),
					street: "s",
					houseNumber: "1",
					city: "c",
					province: "p",
					phoneNumber: "1",
					email: "a@b.c",
					enrollmentDate: new Date(),
					remainingEntrances: 5,
				}),
			MutationAllowlistError
		);
	});
});
