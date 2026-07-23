"use server";

import {
	assertAccountDeleteAllowed,
	assertAccountRoleMutation,
	toAppRole,
} from "@/lib/domain/account-role-hierarchy";
import { AuthError, requireRole, requireRoleUnlessPublic } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

/** Public register helper; when a session exists, Admin+ only (dashboard create). */
export async function createAccount(input: {
	username: string;
	password: string;
	employeeId: number;
}) {
	await requireRoleUnlessPublic("Admin");
	assertAllowedMutation("account", "create", input);
	const { username, password, employeeId } = input;
	return await db.account.create({
		data: {
			username,
			password,
			employeeId,
		},
	});
}

export async function getAllAccounts() {
	await requireRole("Admin");
	return await db.account.findMany();
}

/** Accounts waiting for Approvazione (ticket 16). Admin+ only. */
export async function getPendingAccounts() {
	await requireRole("Admin");
	return await db.account.findMany({
		where: { approved: false },
		orderBy: { employeeId: "asc" },
	});
}

/** Public login/register lookup — no session gate. */
export async function getAccount({ username, employeeId }: { username?: string; employeeId?: number }) {
	if (username) {
		return await db.account.findUnique({
			where: {
				username,
			},
		});
	} else if (employeeId) {
		return await db.account.findUnique({
			where: {
				employeeId,
			},
		});
	}
}

/** Used by /api/auth/me after cookie verify — no extra role gate. */
export async function getAccountSafe(username: string) {
	return await db.account.findUnique({
		where: {
			username,
		},
		select: {
			employee: true,
			role: true,
			approved: true,
		},
	});
}

/**
 * Admin+ may edit Accounts; hierarchy: only strictly inferior roles.
 * Assigning Owner is never allowed via this path (DB-only promotion).
 */
export async function editAccount(input: {
	employeeId: number;
	role: Role;
	approved: boolean;
}) {
	const session = await requireRole("Admin");
	assertAllowedMutation("account", "update", input);
	const { employeeId, role, approved } = input;

	const target = await db.account.findUnique({ where: { employeeId } });
	if (!target) {
		throw new AuthError("Account non trovato", 404);
	}

	const actorRole = toAppRole(session.r);
	const targetRole = toAppRole(target.role);
	const nextRole = toAppRole(role);

	try {
		assertAccountRoleMutation({
			actorRole,
			targetCurrentRole: targetRole,
			nextRole,
		});
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "Forbidden", 403);
	}

	return await db.account.update({
		where: {
			employeeId,
		},
		data: {
			role,
			approved,
		},
	});
}

/** Approve a pending Account (keeps current role). Hierarchy-gated. */
export async function approveAccount({ employeeId }: { employeeId: number }) {
	const session = await requireRole("Admin");
	const target = await db.account.findUnique({ where: { employeeId } });
	if (!target) {
		throw new AuthError("Account non trovato", 404);
	}
	if (target.approved) {
		throw new AuthError("Account già approvato", 400);
	}

	const payload = {
		employeeId,
		role: target.role,
		approved: true,
	};
	assertAllowedMutation("account", "update", payload);

	const actorRole = toAppRole(session.r);
	const targetRole = toAppRole(target.role);
	try {
		assertAccountRoleMutation({
			actorRole,
			targetCurrentRole: targetRole,
			nextRole: targetRole,
		});
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "Forbidden", 403);
	}

	return await db.account.update({
		where: { employeeId },
		data: { approved: true },
	});
}

/** Reject a pending registration by deleting the Account. Hierarchy-gated. */
export async function rejectAccount({ employeeId }: { employeeId: number }) {
	const session = await requireRole("Admin");
	const target = await db.account.findUnique({ where: { employeeId } });
	if (!target) {
		throw new AuthError("Account non trovato", 404);
	}
	if (target.approved) {
		throw new AuthError("Account già approvato: usa eliminazione dalla tabella", 400);
	}

	const actorRole = toAppRole(session.r);
	const targetRole = toAppRole(target.role);
	try {
		assertAccountDeleteAllowed({ actorRole, targetRole });
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "Forbidden", 403);
	}

	return await db.account.delete({
		where: { employeeId },
	});
}

export async function deleteAccount({ employeeId }: { employeeId: number }) {
	const session = await requireRole("Admin");
	const target = await db.account.findUnique({ where: { employeeId } });
	if (!target) {
		throw new AuthError("Account non trovato", 404);
	}

	const actorRole = toAppRole(session.r);
	const targetRole = toAppRole(target.role);
	try {
		assertAccountDeleteAllowed({ actorRole, targetRole });
	} catch (err) {
		throw new AuthError(err instanceof Error ? err.message : "Forbidden", 403);
	}

	return await db.account.delete({
		where: {
			employeeId,
		},
	});
}
