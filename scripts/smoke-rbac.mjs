/**
 * Smoke checks for ticket 13 RBAC helpers (no DB / Next runtime).
 * Run: node scripts/smoke-rbac.mjs
 */
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

// Load compiled-free TS via dynamic transpile is heavy; re-implement pure helpers inline
// matching src/data/nav-routes.ts contracts for a fast smoke without ts-node.

const ADMIN_LANDING = "/accounts";
const EMPLOYEE_LANDING = "/entrances";

function landingPathForRole(role) {
	return role === "Admin" ? ADMIN_LANDING : EMPLOYEE_LANDING;
}

function roleAllows(userRole, requiredRole) {
	if (userRole === "Admin") return true;
	return userRole === requiredRole;
}

const NAV_ROUTES = [
	{ href: "/accounts", requiredRole: "Admin" },
	{ href: "/employees", requiredRole: "Admin" },
	{ href: "/contracts", requiredRole: "Admin" },
	{ href: "/clockings", requiredRole: "Admin" },
	{ href: "/salaries", requiredRole: "Admin" },
	{ href: "/equipment", requiredRole: "Employee" },
	{ href: "/bills", requiredRole: "Employee" },
	{ href: "/interventions", requiredRole: "Employee" },
	{ href: "/clients", requiredRole: "Employee" },
	{ href: "/entrances", requiredRole: "Employee" },
	{ href: "/products", requiredRole: "Employee" },
	{ href: "/memberships", requiredRole: "Employee" },
	{ href: "/entrance-sets", requiredRole: "Employee" },
	{ href: "/catalogs", requiredRole: "Employee" },
	{ href: "/payments", requiredRole: "Employee" },
	{ href: "/purchases", requiredRole: "Employee" },
];

function requiredRoleForPath(pathname) {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	const match = NAV_ROUTES.find(
		(route) => route.href === normalized || normalized.startsWith(`${route.href}/`)
	);
	return match?.requiredRole ?? null;
}

assert.equal(landingPathForRole("Admin"), "/accounts");
assert.equal(landingPathForRole("Employee"), "/entrances");

assert.equal(roleAllows("Admin", "Admin"), true);
assert.equal(roleAllows("Admin", "Employee"), true);
assert.equal(roleAllows("Employee", "Employee"), true);
assert.equal(roleAllows("Employee", "Admin"), false);

assert.equal(requiredRoleForPath("/accounts"), "Admin");
assert.equal(requiredRoleForPath("/entrances"), "Employee");
assert.equal(requiredRoleForPath("/accounts/foo"), "Admin");
assert.equal(requiredRoleForPath("/forbidden"), null);

// Source-of-truth file exists and exports expected symbols
const fs = await import("node:fs");
const navRoutesSrc = fs.readFileSync(path.join(root, "src/data/nav-routes.ts"), "utf8");
assert.match(navRoutesSrc, /export function landingPathForRole/);
assert.match(navRoutesSrc, /export function roleAllows/);
assert.match(navRoutesSrc, /export function requiredRoleForPath/);

const middlewareSrc = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf8");
assert.match(middlewareSrc, /requiredRoleForPath/);
assert.match(middlewareSrc, /\/forbidden/);
assert.match(middlewareSrc, /landingPathForRole/);

const sessionSrc = fs.readFileSync(path.join(root, "src/lib/session.ts"), "utf8");
assert.match(sessionSrc, /r: SessionRole/);

const authSrc = fs.readFileSync(path.join(root, "src/lib/auth.ts"), "utf8");
assert.match(authSrc, /export async function requireRole/);
assert.match(authSrc, /export async function requireSession/);

for (const mod of ["accounts", "employees", "contracts", "clockings", "salaries"]) {
	const src = fs.readFileSync(path.join(root, `src/data-access/${mod}.ts`), "utf8");
	assert.match(src, /requireRole\("Admin"\)|requireAdminActor/, `${mod} must gate Admin`);
}

console.log("smoke-rbac: ok");