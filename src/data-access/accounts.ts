"use server";

import { toAppRole, toPrismaRole } from "@/lib/domain/roles";
import {
	assertRoleHierarchy,
	getOptionalSession,
	requireAdminActor,
	requireRole,
} from "@/lib/auth";
import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
} from "@/lib/list";
import {
	ACCOUNT_DEFAULT_SORT,
	ACCOUNT_FILTER_ALLOWLIST,
	ACCOUNT_SORT_ALLOWLIST,
} from "@/lib/list/accounts";
import { Account, Prisma, Role } from "@prisma/client";

function parseApprovedFilter(raw: ListFilters[string]): boolean | undefined {
	if (typeof raw === "boolean") return raw;
	if (Array.isArray(raw)) {
		const parsed = [
			...new Set(
				raw
					.map((entry) => parseApprovedFilter(entry))
					.filter((entry): entry is boolean => entry !== undefined)
			),
		];
		return parsed.length === 1 ? parsed[0] : undefined;
	}
	if (typeof raw !== "string") return undefined;
	const value = raw.trim().toLowerCase();
	if (value === "true" || value === "1" || value === "si" || value === "sì") return true;
	if (value === "false" || value === "0" || value === "no") return false;
	return undefined;
}

function parseRoleFilter(raw: ListFilters[string]): Role | Role[] | undefined {
	const collect = (entry: unknown): Role | undefined => {
		if (typeof entry !== "string") return undefined;
		const value = entry.trim();
		const appRole = toAppRole(value);
		return appRole ? toPrismaRole(appRole) : undefined;
	};

	if (Array.isArray(raw)) {
		const roles = [
			...new Set(raw.map(collect).filter((role): role is Role => role !== undefined)),
		];
		if (roles.length === 0) return undefined;
		return roles.length === 1 ? roles[0]! : roles;
	}

	return collect(raw);
}

function buildAccountWhere(filters: ListFilters): Prisma.AccountWhereInput {
	const where: Prisma.AccountWhereInput = {};

	const username = filters.username;
	if (typeof username === "string") {
		const value = username.trim();
		if (value) where.username = { contains: value };
	}

	const role = parseRoleFilter(filters.role);
	if (role !== undefined) {
		where.role = Array.isArray(role) ? { in: role } : role;
	}

	const approved = parseApprovedFilter(filters.approved);
	if (approved !== undefined) where.approved = approved;

	const employee = filters.employee;
	if (typeof employee === "string") {
		const value = employee.trim();
		if (value) {
			where.employee = {
				OR: [
					{ surname: { contains: value } },
					{ name: { contains: value } },
				],
			};
		}
	}

	return where;
}

const accountInclude = { employee: true } as const;

export type AccountRow = Prisma.AccountGetPayload<{
	include: typeof accountInclude;
}>;

/**
 * Lista Account server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listAccounts(
	input: ListQueryInput = {}
): Promise<ListResult<AccountRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: ACCOUNT_SORT_ALLOWLIST,
		filterAllowlist: ACCOUNT_FILTER_ALLOWLIST,
		defaultSort: [...ACCOUNT_DEFAULT_SORT],
	});
	const where = buildAccountWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK username (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "username" in o) ? [] : [{ username: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.account.count({ where }),
		db.account.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: accountInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

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

/** Coda Approvazione — solo Account non ancora approvati (Admin+). */
export async function getPendingAccounts() {
	await requireAdminActor();
	return await db.account.findMany({
		where: { approved: false },
		include: {
			employee: {
				select: { id: true, name: true, surname: true },
			},
		},
		orderBy: { username: "asc" },
	});
}

/** Accetta un Account in coda (Admin+, rispetto gerarchia). */
export async function approveAccount({ employeeId }: { employeeId: number }) {
	const actor = await requireAdminActor();
	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true, approved: true },
	});
	const targetRole = toAppRole(target?.role);
	if (!target || !targetRole) {
		throw new Error("Account non trovato");
	}
	if (target.approved) {
		throw new Error("L'account e' gia' approvato");
	}
	assertRoleHierarchy(actor.role, targetRole);
	assertMutationPayload("account", "update", { employeeId, approved: true });
	return await db.account.update({
		where: { employeeId },
		data: { approved: true },
	});
}

/**
 * Rifiuta un Account in coda eliminando la registrazione pendente.
 * Solo se `approved === false` (Admin+, rispetto gerarchia).
 */
export async function rejectPendingAccount({ employeeId }: { employeeId: number }) {
	const actor = await requireAdminActor();
	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true, approved: true },
	});
	const targetRole = toAppRole(target?.role);
	if (!target || !targetRole) {
		throw new Error("Account non trovato");
	}
	if (target.approved) {
		throw new Error("Non puoi rifiutare un account gia' approvato");
	}
	assertRoleHierarchy(actor.role, targetRole);
	return await db.account.delete({
		where: { employeeId },
	});
}

/** Login / register lookup - no session gate. */
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

	const nextRole = toAppRole(role);
	if (!nextRole) {
		throw new Error("Ruolo non valido");
	}

	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true },
	});
	const targetRole = toAppRole(target?.role);
	if (!target || !targetRole) {
		throw new Error("Account non trovato");
	}

	assertRoleHierarchy(actor.role, targetRole, nextRole);

	return await db.account.update({
		where: {
			employeeId,
		},
		data: {
			role: toPrismaRole(nextRole),
			approved,
		},
		include: accountInclude,
	});
}

export async function deleteAccount({ employeeId }: { employeeId: number }) {
	const actor = await requireAdminActor();
	const target = await db.account.findUnique({
		where: { employeeId },
		select: { role: true },
	});
	const targetRole = toAppRole(target?.role);
	if (!target || !targetRole) {
		throw new Error("Account non trovato");
	}
	assertRoleHierarchy(actor.role, targetRole);
	return await db.account.delete({
		where: {
			employeeId,
		},
	});
}
