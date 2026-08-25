"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	buildListResult,
	employeeJoinOrderBy,
	normalizeListQuery,
	toPrismaPage,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import {
	CLOCKING_DEFAULT_SORT,
	CLOCKING_FILTER_ALLOWLIST,
	CLOCKING_SORT_ALLOWLIST,
} from "@/lib/list/clockings";
import { Clocking, Prisma } from "@prisma/client";

const clockingInclude = { employee: true } as const;

export type ClockingRow = Prisma.ClockingGetPayload<{
	include: typeof clockingInclude;
}>;

function parsePositiveIntFilter(raw: ListFilters[string]): number | undefined {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const n = Math.trunc(raw);
		return n > 0 ? n : undefined;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (!/^\d+$/.test(trimmed)) return undefined;
		const n = Number.parseInt(trimmed, 10);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	}
	return undefined;
}

function buildClockingWhere(filters: ListFilters): Prisma.ClockingWhereInput {
	const where: Prisma.ClockingWhereInput = {};

	const employeeId = parsePositiveIntFilter(filters.employeeId);
	if (employeeId !== undefined) where.employeeId = employeeId;

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

function buildClockingOrderBy(
	sort: ListSort[]
): Prisma.ClockingOrderByWithRelationInput[] {
	const orderBy: Prisma.ClockingOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "employee":
				orderBy.push(...employeeJoinOrderBy(dir));
				break;
			case "entranceTime":
				orderBy.push({ entranceTime: dir });
				break;
			case "exitTime":
				orderBy.push({ exitTime: dir });
				break;
			default:
				break;
		}
	}
	if (!orderBy.some((o) => "employeeId" in o)) {
		orderBy.push({ employeeId: "asc" });
	}
	if (!orderBy.some((o) => "entranceTime" in o)) {
		orderBy.push({ entranceTime: "asc" });
	}
	return orderBy;
}

/**
 * Lista Timbrature server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listClockings(
	input: ListQueryInput = {}
): Promise<ListResult<ClockingRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: CLOCKING_SORT_ALLOWLIST,
		filterAllowlist: CLOCKING_FILTER_ALLOWLIST,
		defaultSort: [...CLOCKING_DEFAULT_SORT],
	});
	const where = buildClockingWhere(query.filters);
	const { skip, take } = toPrismaPage(query);
	const orderByStable = buildClockingOrderBy(query.sort);
	const [total, items] = await Promise.all([
		db.clocking.count({ where }),
		db.clocking.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: clockingInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createClocking(input: {
	employeeId: number;
	entranceTime: Date;
	exitTime?: Date;
}) {
	await requireRole("Admin");
	assertMutationPayload("clocking", "create", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.create({
		data: {
			employeeId,
			entranceTime,
			exitTime,
		},
	});
}

export async function getAllClockings() {
	await requireRole("Admin");
	return await db.clocking.findMany();
}

export async function getClocking(employeeId: number, entranceTime: Date) {
	await requireRole("Admin");
	return await db.clocking.findUnique({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}

export async function editClocking(input: Clocking): Promise<ClockingRow> {
	await requireRole("Admin");
	assertMutationPayload("clocking", "update", input);
	const { employeeId, entranceTime, exitTime } = input;
	return await db.clocking.update({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
		data: {
			exitTime,
		},
		include: clockingInclude,
	});
}

export async function deleteClocking({ employeeId, entranceTime }: { employeeId: number; entranceTime: Date }) {
	await requireRole("Admin");
	return await db.clocking.delete({
		where: {
			employeeId_entranceTime: {
				employeeId,
				entranceTime,
			},
		},
	});
}
