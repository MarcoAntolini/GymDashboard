/**
 * Smoke: RBAC path → role map, landings, Owner > Admin > Employee hierarchy.
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

const ROLE_RANK = { Employee: 1, Admin: 2, Owner: 3 };

function roleAllows(userRole, requiredRole) {
	return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

function canManageRole(actorRole, targetRole) {
	return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

function landingPathForRole(role) {
	return role === "Employee" ? "/entrances" : "/accounts";
}

function requiredRoleForPath(pathname) {
	if (ADMIN_ROUTES.includes(pathname)) return "Admin";
	if (EMPLOYEE_ROUTES.includes(pathname)) return "Employee";
	return null;
}

assert.equal(landingPathForRole("Owner"), "/accounts");
assert.equal(landingPathForRole("Admin"), "/accounts");
assert.equal(landingPathForRole("Employee"), "/entrances");

assert.equal(roleAllows("Owner", "Owner"), true);
assert.equal(roleAllows("Owner", "Admin"), true);
assert.equal(roleAllows("Admin", "Admin"), true);
assert.equal(roleAllows("Admin", "Employee"), true);
assert.equal(roleAllows("Admin", "Owner"), false);
assert.equal(roleAllows("Employee", "Employee"), true);
assert.equal(roleAllows("Employee", "Admin"), false);

assert.equal(canManageRole("Owner", "Admin"), true);
assert.equal(canManageRole("Owner", "Employee"), true);
assert.equal(canManageRole("Owner", "Owner"), false);
assert.equal(canManageRole("Admin", "Employee"), true);
assert.equal(canManageRole("Admin", "Admin"), false);
assert.equal(canManageRole("Admin", "Owner"), false);
assert.equal(canManageRole("Employee", "Employee"), false);

for (const href of ADMIN_ROUTES) {
	assert.equal(requiredRoleForPath(href), "Admin", href);
	assert.equal(roleAllows("Employee", "Admin"), false);
	assert.equal(roleAllows("Admin", requiredRoleForPath(href)), true);
	assert.equal(roleAllows("Owner", requiredRoleForPath(href)), true);
}

for (const href of EMPLOYEE_ROUTES) {
	assert.equal(requiredRoleForPath(href), "Employee", href);
	assert.equal(roleAllows("Employee", "Employee"), true);
	assert.equal(roleAllows("Admin", "Employee"), true);
	assert.equal(roleAllows("Owner", "Employee"), true);
}

assert.equal(requiredRoleForPath("/auth"), null);
assert.equal(requiredRoleForPath("/forbidden"), null);

console.log("smoke-rbac: ok");
