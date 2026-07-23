"use server";

import { getSession, requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Account, Prisma, Role } from "@prisma/client";

/** List/create/edit responses never include the password hash. */
export type AccountListItem = Omit<Account, "password">;

const accountListSelect = {
	username: true,
	role: true,
	approved: true,
	employeeId: true,
} as const;

const ROLE_LABEL_TO_ROLE: Record<string, Role> = {
	Amministratore: Role.Admin,
	Dipendente: Role.Employee,
	[Role.Admin]: Role.Admin,
	[Role.Employee]: Role.Employee,
};

const APPROVED_LABEL_TO_BOOL: Record<string, boolean> = {
	Approvato: true,
	"In attesa": false,
	true: true,
	false: false,
};

const accountFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.AccountWhereInput | undefined>
> = {
	username: (filter) => {
		const value = textContains(filter);
		return value ? { username: { contains: value } } : undefined;
	},
	roleLabel: (filter) => {
		const labels = enumValues(filter);
		if (!labels) return undefined;
		const roles = labels
			.map((label) => ROLE_LABEL_TO_ROLE[label])
			.filter((role): role is Role => role != null);
		return roles.length > 0 ? { role: { in: roles } } : undefined;
	},
	approvedLabel: (filter) => {
		const labels = enumValues(filter);
		if (!labels) return undefined;
		const bools = [
			...new Set(
				labels
					.map((label) => APPROVED_LABEL_TO_BOOL[label])
					.filter((value): value is boolean => value != null)
			),
		];
		if (bools.length === 0) return undefined;
		// Both true and false selected ≡ no approved constraint.
		if (bools.length === 2) return undefined;
		return { approved: bools[0] };
	},
};

const accountSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.AccountOrderByWithRelationInput>
> = {
	employeeId: (desc) => ({ employeeId: desc ? "desc" : "asc" }),
	username: (desc) => ({ username: desc ? "desc" : "asc" }),
	roleLabel: (desc) => ({ role: desc ? "desc" : "asc" }),
	approvedLabel: (desc) => ({ approved: desc ? "desc" : "asc" }),
};

async function loadAccountFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const facets: Record<string, FacetOption[]> = {};

	const roleWhere = buildWhere(filters, accountFilterMap, { exclude: "roleLabel" });
	const roleGroups = await db.account.groupBy({
		by: ["role"],
		where: roleWhere,
		_count: { _all: true },
		orderBy: { role: "asc" },
	});
	facets.roleLabel = roleGroups.map((group) => ({
		value: group.role === Role.Admin ? "Amministratore" : "Dipendente",
		count: group._count._all,
	}));

	const approvedWhere = buildWhere(filters, accountFilterMap, { exclude: "approvedLabel" });
	const approvedGroups = await db.account.groupBy({
		by: ["approved"],
		where: approvedWhere,
		_count: { _all: true },
		orderBy: { approved: "asc" },
	});
	facets.approvedLabel = approvedGroups.map((group) => ({
		value: group.approved ? "Approvato" : "In attesa",
		count: group._count._all,
	}));

	return facets;
}

export async function createAccount({
	username,
	password,
	employeeId,
}: {
	username: string;
	password: string;
	employeeId: number;
}): Promise<AccountListItem> {
	const session = await getSession();
	if (session) {
		await requireRole("Admin");
	}
	return await db.account.create({
		data: {
			username,
			password,
			employeeId,
		},
		select: accountListSelect,
	});
}

export async function listAccounts(
	rawQuery: ListQuery
): Promise<ListResult<AccountListItem>> {
	await requireRole("Admin");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, accountFilterMap);
	const orderBy = resolveOrderBy(query.sort, accountSortMap, { username: "asc" });

	const [total, items, facets] = await Promise.all([
		db.account.count({ where }),
		db.account.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			select: accountListSelect,
		}),
		loadAccountFacets(query.filters),
	]);

	return { items, total, facets };
}

export async function getAccount({
	username,
	employeeId,
}: {
	username?: string;
	employeeId?: number;
}) {
	const session = await getSession();
	if (session) {
		await requireRole("Admin");
	}
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
	const session = await requireRole("Employee");
	if (session.u !== username) {
		await requireRole("Admin");
	}
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

export async function editAccount({
	employeeId,
	role,
	approved,
}: {
	employeeId: number;
	role: Role;
	approved: boolean;
}): Promise<AccountListItem> {
	await requireRole("Admin");
	return await db.account.update({
		where: {
			employeeId,
		},
		data: {
			role,
			approved,
		},
		select: accountListSelect,
	});
}

export async function deleteAccount({
	employeeId,
}: {
	employeeId: number;
}): Promise<AccountListItem> {
	await requireRole("Admin");
	return await db.account.delete({
		where: {
			employeeId,
		},
		select: accountListSelect,
	});
}

export async function listPendingAccounts(): Promise<AccountListItem[]> {
	await requireRole("Admin");
	return await db.account.findMany({
		where: { approved: false },
		select: accountListSelect,
		orderBy: { username: "asc" },
	});
}

export async function approveAccount({ employeeId }: { employeeId: number }): Promise<AccountListItem> {
	await requireRole("Admin");
	const account = await db.account.findUnique({ where: { employeeId } });
	if (!account) {
		throw new Error("Account non trovato.");
	}
	if (account.approved) {
		const { password: _password, ...safe } = account;
		return safe;
	}
	return await db.account.update({
		where: { employeeId },
		data: { approved: true },
		select: accountListSelect,
	});
}

/** Rifiuta: deletes the pending Account (Dipendente remains). */
export async function rejectPendingAccount({
	employeeId,
}: {
	employeeId: number;
}): Promise<AccountListItem> {
	await requireRole("Admin");
	const account = await db.account.findUnique({ where: { employeeId } });
	if (!account) {
		throw new Error("Account non trovato.");
	}
	if (account.approved) {
		throw new Error("Non puoi rifiutare un Account già approvato.");
	}
	return await db.account.delete({
		where: { employeeId },
		select: accountListSelect,
	});
}
