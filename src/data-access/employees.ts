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
import {
	buildListResult,
	normalizeListQuery,
	toPrismaListArgs,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
} from "@/lib/list";
import {
	EMPLOYEE_DEFAULT_SORT,
	EMPLOYEE_FILTER_ALLOWLIST,
	EMPLOYEE_SORT_ALLOWLIST,
} from "@/lib/list/employees";
import { Employee, Prisma } from "@prisma/client";

function buildEmployeeWhere(filters: ListFilters): Prisma.EmployeeWhereInput {
	const where: Prisma.EmployeeWhereInput = {};
	for (const key of EMPLOYEE_FILTER_ALLOWLIST) {
		const raw = filters[key];
		if (typeof raw !== "string") continue;
		const value = raw.trim();
		if (!value) continue;
		where[key] = { contains: value };
	}
	return where;
}

/**
 * Lista Dipendenti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listEmployees(
	input: ListQueryInput = {}
): Promise<ListResult<Employee>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: EMPLOYEE_SORT_ALLOWLIST,
		filterAllowlist: EMPLOYEE_FILTER_ALLOWLIST,
		defaultSort: [...EMPLOYEE_DEFAULT_SORT],
	});
	const where = buildEmployeeWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su id (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "id" in o) ? [] : [{ id: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.employee.count({ where }),
		db.employee.findMany({ where, skip, take, orderBy: orderByStable }),
	]);
	return buildListResult(items, total, query);
}

export async function createEmployee(input: {
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber?: string;
	email?: string;
	hiringDate?: Date;
}) {
	await requireRole("Admin");
	assertMutationPayload("employee", "create", input);
	const {
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;
	return await db.employee.create({
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber: phoneNumber || "",
			email: email || "",
			hiringDate: hiringDate || new Date()
		}
	});
}

export async function getAllEmployees() {
	await requireRole("Admin");
	return await db.employee.findMany();
}

/** Register may call without session; authenticated callers need Admin. */
export async function getEmployee(id: number) {
	const session = await getOptionalSession();
	if (session) {
		await requireRole("Admin");
	}
	return await db.employee.findUnique({
		where: {
			id
		}
	});
}

/**
 * Modifica anagrafica completa di un Dipendente (Admin+).
 * Gerarchia: Owner → tutti; Admin → solo Dipendenti (ruolo Employee).
 * Dipendente senza Account: modificabile da Admin+.
 * Self-edit della propria riga: consentito ad Admin/Owner (identità anche da Profilo).
 */
export async function editEmployee(input: {
	id: number;
	taxCode: string;
	name: string;
	surname: string;
	birthDate: Date;
	street: string;
	houseNumber: string;
	city: string;
	province: string;
	phoneNumber: string;
	email: string;
	hiringDate: Date;
}) {
	const actor = await requireAdminActor();
	assertMutationPayload("employee", "update", input);
	const {
		id,
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		hiringDate,
	} = input;

	const target = await db.employee.findUnique({
		where: { id },
		include: {
			account: { select: { role: true, username: true } },
		},
	});
	if (!target) {
		throw new Error("Dipendente non trovato");
	}

	const actorAccount = await db.account.findUnique({
		where: { username: actor.username },
		select: { employeeId: true },
	});
	const editingSelf = actorAccount?.employeeId === id;

	if (!editingSelf && target.account) {
		if (!isAppRole(target.account.role)) {
			throw new Error("Account non valido");
		}
		assertRoleHierarchy(actor.role, target.account.role);
	}

	return await db.employee.update({
		where: {
			id
		},
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			hiringDate
		}
	});
}

export async function deleteEmployee({ id }: { id: number }) {
	await requireRole("Admin");
	return await db.employee.delete({
		where: {
			id
		}
	});
}

export async function getEmployeesWithoutAccount() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			account: {
				is: null
			}
		}
	});
}

export async function getEmployeesWithoutContract() {
	await requireRole("Admin");
	return await db.employee.findMany({
		where: {
			contracts: {
				none: {}
			}
		}
	});
}
