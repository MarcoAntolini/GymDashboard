"use server";

import { requireRole, requireRoleUnlessPublic } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

/** Public register helper; when a session exists, Admin-only (dashboard create). */
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

export async function editAccount(input: {
	employeeId: number;
	role: Role;
	approved: boolean;
}) {
	await requireRole("Admin");
	assertAllowedMutation("account", "update", input);
	const { employeeId, role, approved } = input;
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

export async function deleteAccount({ employeeId }: { employeeId: number }) {
	await requireRole("Admin");
	return await db.account.delete({
		where: {
			employeeId,
		},
	});
}
