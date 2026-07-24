"use server";

import { isAppRole } from "@/data/nav-routes";
import {
	assertRoleHierarchy,
	getOptionalSession,
	requireAdminActor,
	requireRole,
} from "@/lib/auth";
import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function createAccount(input: {
	username: string;
	password: string;
	employeeId: number;
}) {
	assertMutationPayload("account", "create", input);
	// Public register (no session) stays open; dashboard create requires Admin+.
	const session = await getOptionalSession();
	if (session) {
		await requireRole("Admin");
	}
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

/** Login / register lookup — no session gate. */
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
	assertMutationPayload("account", "update", input);
	const actor = await requireAdminActor();
	const { employeeId, role, approved } = input;

	if (!isAppRole(role)) {
		throw new Error("Ruolo non valido");
	}

	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true },
	});
	if (!target || !isAppRole(target.role)) {
		throw new Error("Account non trovato");
	}

	assertRoleHierarchy(actor.role, target.role, role);

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
	const actor = await requireAdminActor();
	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true },
	});
	if (!target || !isAppRole(target.role)) {
		throw new Error("Account non trovato");
	}
	assertRoleHierarchy(actor.role, target.role);
	return await db.account.delete({
		where: {
			employeeId,
		},
	});
}
