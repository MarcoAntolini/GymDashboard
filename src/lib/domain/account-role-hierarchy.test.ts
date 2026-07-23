import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	assertAccountDeleteAllowed,
	assertAccountRoleMutation,
	toAppRole,
} from "./account-role-hierarchy";

describe("assertAccountRoleMutation", () => {
	it("allows Owner to demote Admin to Employee", () => {
		assert.doesNotThrow(() =>
			assertAccountRoleMutation({
				actorRole: "Owner",
				targetCurrentRole: "Admin",
				nextRole: "Employee",
			})
		);
	});

	it("allows Owner to promote Employee to Admin", () => {
		assert.doesNotThrow(() =>
			assertAccountRoleMutation({
				actorRole: "Owner",
				targetCurrentRole: "Employee",
				nextRole: "Admin",
			})
		);
	});

	it("rejects promoting anyone to Owner (including by Owner)", () => {
		assert.throws(
			() =>
				assertAccountRoleMutation({
					actorRole: "Owner",
					targetCurrentRole: "Admin",
					nextRole: "Owner",
				}),
			/assegnare/
		);
	});

	it("rejects Admin managing another Admin", () => {
		assert.throws(
			() =>
				assertAccountRoleMutation({
					actorRole: "Admin",
					targetCurrentRole: "Admin",
					nextRole: "Employee",
				}),
			/gestire/
		);
	});

	it("rejects Admin promoting Employee to Admin", () => {
		assert.throws(
			() =>
				assertAccountRoleMutation({
					actorRole: "Admin",
					targetCurrentRole: "Employee",
					nextRole: "Admin",
				}),
			/assegnare/
		);
	});

	it("allows Admin to edit Employee (role stays Employee)", () => {
		assert.doesNotThrow(() =>
			assertAccountRoleMutation({
				actorRole: "Admin",
				targetCurrentRole: "Employee",
				nextRole: "Employee",
			})
		);
	});
});

describe("assertAccountDeleteAllowed", () => {
	it("allows Owner to delete Admin; rejects peer Owner", () => {
		assert.doesNotThrow(() =>
			assertAccountDeleteAllowed({ actorRole: "Owner", targetRole: "Admin" })
		);
		assert.throws(
			() => assertAccountDeleteAllowed({ actorRole: "Owner", targetRole: "Owner" }),
			/eliminare/
		);
	});

	it("allows Admin to delete Employee; rejects Admin peer", () => {
		assert.doesNotThrow(() =>
			assertAccountDeleteAllowed({ actorRole: "Admin", targetRole: "Employee" })
		);
		assert.throws(
			() => assertAccountDeleteAllowed({ actorRole: "Admin", targetRole: "Admin" }),
			/eliminare/
		);
	});
});

describe("toAppRole", () => {
	it("accepts known roles", () => {
		assert.equal(toAppRole("Owner"), "Owner");
		assert.equal(toAppRole("Admin"), "Admin");
		assert.equal(toAppRole("Employee"), "Employee");
	});

	it("rejects unknown", () => {
		assert.throws(() => toAppRole("Nope"), /non valido/);
	});
});
