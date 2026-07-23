import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	NAV_ROUTE_GROUPS,
	assignableRoles,
	canManageRole,
	isAppRole,
	landingPathForRole,
	requiredRoleForPath,
	roleAllows,
} from "./nav-routes";

describe("roleAllows", () => {
	it("lets Owner reach Owner, Admin, and Employee routes", () => {
		assert.equal(roleAllows("Owner", "Owner"), true);
		assert.equal(roleAllows("Owner", "Admin"), true);
		assert.equal(roleAllows("Owner", "Employee"), true);
	});

	it("lets Admin reach Admin and Employee routes but not Owner", () => {
		assert.equal(roleAllows("Admin", "Admin"), true);
		assert.equal(roleAllows("Admin", "Employee"), true);
		assert.equal(roleAllows("Admin", "Owner"), false);
	});

	it("lets Employee reach only Employee routes", () => {
		assert.equal(roleAllows("Employee", "Employee"), true);
		assert.equal(roleAllows("Employee", "Admin"), false);
		assert.equal(roleAllows("Employee", "Owner"), false);
	});
});

describe("canManageRole / assignableRoles", () => {
	it("Owner manages Admin and Employee only (not Owner peers)", () => {
		assert.equal(canManageRole("Owner", "Admin"), true);
		assert.equal(canManageRole("Owner", "Employee"), true);
		assert.equal(canManageRole("Owner", "Owner"), false);
		assert.deepEqual(assignableRoles("Owner"), ["Admin", "Employee"]);
	});

	it("Admin manages Employee only (not Admin peers or Owner)", () => {
		assert.equal(canManageRole("Admin", "Employee"), true);
		assert.equal(canManageRole("Admin", "Admin"), false);
		assert.equal(canManageRole("Admin", "Owner"), false);
		assert.deepEqual(assignableRoles("Admin"), ["Employee"]);
	});

	it("Employee manages no roles", () => {
		assert.equal(canManageRole("Employee", "Employee"), false);
		assert.equal(canManageRole("Employee", "Admin"), false);
		assert.equal(canManageRole("Employee", "Owner"), false);
		assert.deepEqual(assignableRoles("Employee"), []);
	});
});

describe("landingPathForRole", () => {
	it("sends Owner and Admin to accounts, Employee to entrances", () => {
		assert.equal(landingPathForRole("Owner"), "/accounts");
		assert.equal(landingPathForRole("Admin"), "/accounts");
		assert.equal(landingPathForRole("Employee"), "/entrances");
	});
});

describe("requiredRoleForPath", () => {
	it("maps Admin-only and Employee routes", () => {
		assert.equal(requiredRoleForPath("/accounts"), "Admin");
		assert.equal(requiredRoleForPath("/salaries"), "Admin");
		assert.equal(requiredRoleForPath("/entrances"), "Employee");
		assert.equal(requiredRoleForPath("/clients"), "Employee");
	});

	it("returns null for auth/forbidden and unknown paths", () => {
		assert.equal(requiredRoleForPath("/auth"), null);
		assert.equal(requiredRoleForPath("/forbidden"), null);
		assert.equal(requiredRoleForPath("/nope"), null);
	});
});

describe("NAV_ROUTE_GROUPS", () => {
	it("covers every listed href once with a valid role", () => {
		const hrefs = new Set<string>();
		for (const { group } of NAV_ROUTE_GROUPS) {
			for (const route of group) {
				assert.ok(isAppRole(route.requiredRole), route.href);
				assert.equal(hrefs.has(route.href), false, `duplicate ${route.href}`);
				hrefs.add(route.href);
			}
		}
		assert.ok(hrefs.has("/accounts"));
		assert.ok(hrefs.has("/entrances"));
	});
});

describe("isAppRole", () => {
	it("accepts Owner, Admin, Employee", () => {
		assert.equal(isAppRole("Owner"), true);
		assert.equal(isAppRole("Admin"), true);
		assert.equal(isAppRole("Employee"), true);
		assert.equal(isAppRole("Nope"), false);
	});
});
