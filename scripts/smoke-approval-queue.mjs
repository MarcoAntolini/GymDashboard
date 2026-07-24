/**
 * Smoke checks for ticket 16 — Coda Approvazione Account (static / path RBAC).
 * Run: node scripts/smoke-approval-queue.mjs
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const ROLE_RANK = { Employee: 0, Admin: 1, Owner: 2 };
function roleAllows(userRole, requiredRole) {
	return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}
function requiredRoleForPath(pathname) {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	if (normalized === "/accounts" || normalized.startsWith("/accounts/")) return "Admin";
	return null;
}

assert.equal(roleAllows("Owner", "Admin"), true);
assert.equal(roleAllows("Admin", "Admin"), true);
assert.equal(roleAllows("Employee", "Admin"), false);
assert.equal(requiredRoleForPath("/accounts"), "Admin");
assert.equal(requiredRoleForPath("/accounts/"), "Admin");

const accountsDa = fs.readFileSync(path.join(root, "src/data-access/accounts.ts"), "utf8");
assert.match(accountsDa, /export async function getPendingAccounts/);
assert.match(accountsDa, /export async function approveAccount/);
assert.match(accountsDa, /export async function rejectPendingAccount/);
assert.match(accountsDa, /requireAdminActor/);
assert.match(accountsDa, /approved:\s*false/);

const queueUi = fs.readFileSync(
	path.join(root, "src/app/(dashboard)/accounts/approval-queue-sheet.tsx"),
	"utf8"
);
assert.match(queueUi, /Coda approvazione/);
assert.match(queueUi, /Approva/);
assert.match(queueUi, /Rifiuta/);
assert.match(queueUi, /roleAllows\(actorRole,\s*"Admin"\)/);

const page = fs.readFileSync(path.join(root, "src/app/(dashboard)/accounts/page.tsx"), "utf8");
assert.match(page, /ApprovalQueueToolbarButton/);
assert.match(page, /extraToolbar/);

console.log("smoke-approval-queue: ok");
