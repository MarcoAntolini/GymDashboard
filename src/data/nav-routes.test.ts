import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	NAV_ROUTE_GROUPS,
	isAppRole,
	landingPathForRole,
	requiredRoleForPath,
	roleAllows,
} from "./nav-routes";

describe("roleAllows", () => {
	it("lets Admin reach Admin and Employee routes", () => {
		assert.equal(roleAllows("Admin", "Admin"), true);
		assert.equal(roleAllows("Admin", "Employee"), true);
	});

	it("lets Employee reach only Employee routes", () => {
		assert.equal(roleAllows("Employee", "Employee"), true);
		assert.equal(roleAllows("Employee", "Admin"), false);
	});
});

describe("landingPathForRole", () => {
	it("sends Admin to accounts and Employee to entrances", () => {
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
