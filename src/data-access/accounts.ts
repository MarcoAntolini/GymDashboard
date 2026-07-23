"use server";

import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function createAccount(input: {
	username: string;
	password: string;
	employeeId: number;
}) {
	assertAllowedMutation("account", "create", input);
	const { username, password, employeeId } = input;
	return await db.account.create({
		data: {
			username,
			password,
			employeeId
		}
	});
}

export async function getAllAccounts() {
	return await db.account.findMany();
}

export async function getAccount({ username, employeeId }: { username?: string; employeeId?: number }) {
	if (username) {
		return await db.account.findUnique({
			where: {
				username
			}
		});
	} else if (employeeId) {
		return await db.account.findUnique({
			where: {
				employeeId
			}
		});
	}
}

export async function getAccountSafe(username: string) {
	return await db.account.findUnique({
		where: {
			username
		},
		select: {
			employee: true,
			role: true,
			approved: true
		}
	});
}

export async function editAccount(input: {
	employeeId: number;
	role: Role;
	approved: boolean;
}) {
	assertAllowedMutation("account", "update", input);
	const { employeeId, role, approved } = input;
	return await db.account.update({
		where: {
			employeeId
		},
		data: {
			role,
			approved
		}
	});
}

export async function deleteAccount({ employeeId }: { employeeId: number }) {
	return await db.account.delete({
		where: {
			employeeId
		}
	});
}
