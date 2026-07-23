/**
 * Smoke: RBAC path → role map, landings, Admin inheritance.
 * Run: node scripts/smoke-rbac.mjs
 *
 * Mirrors src/data/nav-routes.ts (keep in sync).
 */
import assert from "node:assert/strict";

const ADMIN_ROUTES = ["/accounts", "/employees", "/contracts", "/clockings", "/salaries"];
const EMPLOYEE_ROUTES = [
	"/equipment",
	"/bills",
	"/interventions",
	"/clients",
	"/entrances",
	"/products",
	"/memberships",
	"/entrance-sets",
	"/catalogs",
	"/payments",
	"/purchases",
];

function roleAllows(userRole, requiredRole) {
	if (userRole === "Admin") return true;
	return userRole === requiredRole;
}

function landingPathForRole(role) {
	return role === "Admin" ? "/accounts" : "/entrances";
}

function requiredRoleForPath(pathname) {
	if (ADMIN_ROUTES.includes(pathname)) return "Admin";
	if (EMPLOYEE_ROUTES.includes(pathname)) return "Employee";
	return null;
}

assert.equal(landingPathForRole("Admin"), "/accounts");
assert.equal(landingPathForRole("Employee"), "/entrances");

assert.equal(roleAllows("Admin", "Admin"), true);
assert.equal(roleAllows("Admin", "Employee"), true);
assert.equal(roleAllows("Employee", "Employee"), true);
assert.equal(roleAllows("Employee", "Admin"), false);

for (const href of ADMIN_ROUTES) {
	assert.equal(requiredRoleForPath(href), "Admin", href);
	assert.equal(roleAllows("Employee", "Admin"), false);
	assert.equal(roleAllows("Admin", requiredRoleForPath(href)), true);
}

for (const href of EMPLOYEE_ROUTES) {
	assert.equal(requiredRoleForPath(href), "Employee", href);
	assert.equal(roleAllows("Employee", "Employee"), true);
	assert.equal(roleAllows("Admin", "Employee"), true);
}

assert.equal(requiredRoleForPath("/auth"), null);
assert.equal(requiredRoleForPath("/forbidden"), null);

console.log("smoke-rbac: ok");
