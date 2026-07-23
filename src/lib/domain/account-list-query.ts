/**
 * Account list-query helpers (ticket 28).
 *
 * Pure WHERE / sort contract for server-side Account lists — used by
 * `listAccounts` in data-access. Filter keystrokes stay draft until Filtra.
 * Former faceted role/approved filters become exact-match text filters.
 */

import type { ListFilters, ListSort } from "@/lib/domain/list-query";
import { Role } from "@prisma/client";

export const ACCOUNT_LIST_SORT_COLUMNS = ["employeeId", "username"] as const;

export type AccountListSortColumn = (typeof ACCOUNT_LIST_SORT_COLUMNS)[number];

/** Default ORDER BY id dipendente (aligns with approval queue ordering). */
export const ACCOUNT_LIST_DEFAULT_SORT: ListSort = {
	column: "employeeId",
	direction: "asc",
};

/** Search filters shown in ServerListToolbar (former Account DataTable filters). */
export const ACCOUNT_LIST_FILTER_IDS = [
	"username",
	"role",
	"approved",
	"employeeId",
] as const;

export type AccountListFilterId = (typeof ACCOUNT_LIST_FILTER_IDS)[number];

/** Accept Prisma enum keys (Admin) and DB/mapped labels (Amministratore). */
const ROLE_BY_LOWER = new Map<string, Role>();
for (const key of Object.keys(Role) as (keyof typeof Role)[]) {
	const value = Role[key];
	ROLE_BY_LOWER.set(key.toLowerCase(), value);
	ROLE_BY_LOWER.set(String(value).toLowerCase(), value);
}

function filterString(value: unknown): string | null {
	if (value === undefined || value === null) return null;
	const text = typeof value === "string" ? value.trim() : String(value).trim();
	return text === "" ? null : text;
}

function parseRole(value: string): Role | null {
	return ROLE_BY_LOWER.get(value.toLowerCase()) ?? null;
}

function parseApproved(value: string): boolean | null {
	const normalized = value.trim().toLowerCase();
	if (["true", "1", "si", "sì", "yes"].includes(normalized)) return true;
	if (["false", "0", "no"].includes(normalized)) return false;
	return null;
}

function parseEmployeeId(value: string): number | null {
	if (!/^\d+$/.test(value)) return null;
	const n = Number.parseInt(value, 10);
	return Number.isFinite(n) ? n : null;
}

/**
 * Prisma `where` for Account list filters.
 * username: contains; role/approved/employeeId: exact when parseable.
 */
export function buildAccountListWhere(
	filters: ListFilters
): Record<string, unknown> {
	const clauses: Record<string, unknown>[] = [];

	const username = filterString(filters.username);
	if (username !== null) {
		clauses.push({ username: { contains: username } });
	}

	const roleRaw = filterString(filters.role);
	if (roleRaw !== null) {
		const role = parseRole(roleRaw);
		if (role !== null) clauses.push({ role });
	}

	const approvedRaw = filterString(filters.approved);
	if (approvedRaw !== null) {
		const approved = parseApproved(approvedRaw);
		if (approved !== null) clauses.push({ approved });
	}

	const employeeIdRaw = filterString(filters.employeeId);
	if (employeeIdRaw !== null) {
		const employeeId = parseEmployeeId(employeeIdRaw);
		if (employeeId !== null) clauses.push({ employeeId });
	}

	if (clauses.length === 0) return {};
	return { AND: clauses };
}

export function accountListHasActiveFilters(filters: ListFilters): boolean {
	return Object.keys(buildAccountListWhere(filters)).length > 0;
}
