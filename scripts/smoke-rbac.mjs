/**
 * Smoke checks for tickets 13–14 RBAC + Owner hierarchy (no DB / Next runtime).
 * Run: node scripts/smoke-rbac.mjs
 */
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ADMIN_LANDING = "/accounts";
const EMPLOYEE_LANDING = "/entrances";

const ROLE_RANK = { Employee: 0, Admin: 1, Owner: 2 };

function landingPathForRole(role) {
	return role === "Employee" ? EMPLOYEE_LANDING : ADMIN_LANDING;
}

function roleAllows(userRole, requiredRole) {
	return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

function canManageRole(actorRole, targetRole) {
	return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

function assignableRoles(actorRole) {
	return ["Admin", "Employee"].filter((role) => canManageRole(actorRole, role));
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
	{ href: "/sales", requiredRole: "Employee" },
];

function requiredRoleForPath(pathname) {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	const match = NAV_ROUTES.find(
		(route) => route.href === normalized || normalized.startsWith(`${route.href}/`)
	);
	return match?.requiredRole ?? null;
}

assert.equal(landingPathForRole("Owner"), "/accounts");
assert.equal(landingPathForRole("Admin"), "/accounts");
assert.equal(landingPathForRole("Employee"), "/entrances");

assert.equal(roleAllows("Owner", "Owner"), true);
assert.equal(roleAllows("Owner", "Admin"), true);
assert.equal(roleAllows("Owner", "Employee"), true);
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

assert.deepEqual(assignableRoles("Owner"), ["Admin", "Employee"]);
assert.deepEqual(assignableRoles("Admin"), ["Employee"]);
assert.deepEqual(assignableRoles("Employee"), []);

assert.equal(requiredRoleForPath("/accounts"), "Admin");
assert.equal(requiredRoleForPath("/entrances"), "Employee");
assert.equal(requiredRoleForPath("/accounts/foo"), "Admin");
assert.equal(requiredRoleForPath("/forbidden"), null);

const fs = await import("node:fs");
const navRoutesSrc = fs.readFileSync(path.join(root, "src/data/nav-routes.ts"), "utf8");
assert.match(navRoutesSrc, /export type AppRole = "Owner" \| "Admin" \| "Employee"/);
assert.match(navRoutesSrc, /export function landingPathForRole/);
assert.match(navRoutesSrc, /export function roleAllows/);
assert.match(navRoutesSrc, /export function canManageRole/);
assert.match(navRoutesSrc, /export function assignableRoles/);
assert.match(navRoutesSrc, /export function requiredRoleForPath/);

const middlewareSrc = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf8");
assert.match(middlewareSrc, /requiredRoleForPath/);
assert.match(middlewareSrc, /\/forbidden/);
assert.match(middlewareSrc, /landingPathForRole/);

const meSrc = fs.readFileSync(path.join(root, "src/app/api/auth/me/route.ts"), "utf8");
assert.match(meSrc, /payload\.r === account\.role/);
assert.match(meSrc, /createSessionValue/);
assert.match(meSrc, /signSessionValue/);

const navSrc = fs.readFileSync(path.join(root, "src/app/(dashboard)/_components/nav.tsx"), "utf8");
assert.match(navSrc, /requiredRoleForPath/);
assert.match(navSrc, /\/forbidden\?from=/);

const sessionSrc = fs.readFileSync(path.join(root, "src/lib/session.ts"), "utf8");
assert.match(sessionSrc, /r: SessionRole/);

const authSrc = fs.readFileSync(path.join(root, "src/lib/auth.ts"), "utf8");
assert.match(authSrc, /export async function requireRole/);
assert.match(authSrc, /export async function requireSession/);
assert.match(authSrc, /export async function requireOwnerActor/);
assert.match(authSrc, /export function assertRoleHierarchy/);
assert.match(authSrc, /OWNER_ASSIGN_MESSAGE/);

const accountsSrc = fs.readFileSync(path.join(root, "src/data-access/accounts.ts"), "utf8");
assert.match(accountsSrc, /assertRoleHierarchy/);
assert.match(accountsSrc, /requireAdminActor/);

const schemaSrc = fs.readFileSync(path.join(root, "prisma/schema.prisma"), "utf8");
assert.match(schemaSrc, /Owner\s+@map\("Proprietario"\)/);

const columnsSrc = fs.readFileSync(path.join(root, "src/app/(dashboard)/accounts/columns.tsx"), "utf8");
assert.match(columnsSrc, /assignableRoles/);
assert.match(columnsSrc, /canManageRole/);
assert.doesNotMatch(columnsSrc, /SelectItem value=\{Role\.Owner\}/);

for (const mod of ["accounts", "employees", "contracts", "clockings", "salaries"]) {
	const src = fs.readFileSync(path.join(root, `src/data-access/${mod}.ts`), "utf8");
	assert.match(src, /requireRole\("Admin"\)|requireAdminActor/, `${mod} must gate Admin`);
}

console.log("smoke-rbac: ok");
