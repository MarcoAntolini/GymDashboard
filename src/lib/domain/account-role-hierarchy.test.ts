import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	assertAccountDeleteAllowed,
	assertAccountRoleMutation,
	canActOnPendingAccount,
	filterApprovableAccounts,
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

describe("canActOnPendingAccount / filterApprovableAccounts", () => {
	it("allows Owner to act on Admin and Employee pending accounts", () => {
		assert.equal(canActOnPendingAccount("Owner", "Admin"), true);
		assert.equal(canActOnPendingAccount("Owner", "Employee"), true);
		assert.equal(canActOnPendingAccount("Owner", "Owner"), false);
	});

	it("allows Admin to act on Employee only", () => {
		assert.equal(canActOnPendingAccount("Admin", "Employee"), true);
		assert.equal(canActOnPendingAccount("Admin", "Admin"), false);
		assert.equal(canActOnPendingAccount("Admin", "Owner"), false);
	});

	it("filters pending queue to hierarchy-allowed targets", () => {
		const pending = [
			{ employeeId: 1, role: "Employee" },
			{ employeeId: 2, role: "Admin" },
			{ employeeId: 3, role: "Owner" },
			{ employeeId: 4, role: "Nope" },
		];
		assert.deepEqual(
			filterApprovableAccounts("Admin", pending).map((a) => a.employeeId),
			[1]
		);
		assert.deepEqual(
			filterApprovableAccounts("Owner", pending).map((a) => a.employeeId),
			[1, 2]
		);
	});
});
