"use server";

import { db } from "@/lib/db";
import { Role } from "@prisma/client";

export async function createAccount({
	username,
	password,
	employeeId
}: {
	username: string;
	password: string;
	employeeId: number;
}) {
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

export async function editAccount({
	employeeId,
	role,
	approved
}: {
	employeeId: number;
	role: Role;
	approved: boolean;
}) {
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
