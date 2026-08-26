"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { toClient, type ClientOf } from "@/lib/client-payload";
import { db } from "@/lib/db";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaPage,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import {
	EQUIPMENT_DEFAULT_SORT,
	EQUIPMENT_FILTER_ALLOWLIST,
	EQUIPMENT_SORT_ALLOWLIST,
} from "@/lib/list/equipment";
import { Equipment, Prisma } from "@prisma/client";

const equipmentInclude = { payment: true } as const;

export type EquipmentRow = ClientOf<
	Prisma.EquipmentGetPayload<{
		include: typeof equipmentInclude;
	}>
>;

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

function buildEquipmentWhere(filters: ListFilters): Prisma.EquipmentWhereInput {
	const where: Prisma.EquipmentWhereInput = {};

	const paymentId = parsePositiveIntFilter(filters.paymentId);
	if (paymentId !== undefined) where.paymentId = paymentId;

	const provider = filters.provider;
	if (typeof provider === "string") {
		const value = provider.trim();
		if (value) where.provider = { contains: value };
	}

	const description = filters.description;
	if (typeof description === "string") {
		const value = description.trim();
		if (value) where.description = { contains: value };
	}

	return where;
}

function buildEquipmentOrderBy(
	sort: ListSort[]
): Prisma.EquipmentOrderByWithRelationInput[] {
	const orderBy: Prisma.EquipmentOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "provider":
				orderBy.push({ provider: dir });
				break;
			case "paymentDate":
				orderBy.push({ payment: { date: dir } });
				break;
			case "paymentAmount":
				orderBy.push({ payment: { amount: dir } });
				break;
			case "paymentId":
				orderBy.push({ paymentId: dir });
				break;
			default:
				break;
		}
	}
	if (!orderBy.some((o) => "paymentId" in o)) {
		orderBy.push({ paymentId: "asc" });
	}
	return orderBy;
}

/**
 * Lista Attrezzatura server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listEquipment(
	input: ListQueryInput = {}
): Promise<ListResult<EquipmentRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: EQUIPMENT_SORT_ALLOWLIST,
		filterAllowlist: EQUIPMENT_FILTER_ALLOWLIST,
		defaultSort: [...EQUIPMENT_DEFAULT_SORT],
	});
	const where = buildEquipmentWhere(query.filters);
	const { skip, take } = toPrismaPage(query);
	const orderByStable = buildEquipmentOrderBy(query.sort);
	const [total, items] = await Promise.all([
		db.equipment.count({ where }),
		db.equipment.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: equipmentInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createEquipment(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	assertMutationPayload("equipment", "create", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function getAllEquipment() {
	return toClient(
		await db.equipment.findMany({
			include: {
				payment: true,
			},
		})
	);
}

export async function getEquipment(paymentId: number) {
	return toClient(
		await db.equipment.findUnique({
			where: {
				paymentId,
			},
			include: {
				payment: true,
			},
		})
	);
}

export async function editEquipment(input: Equipment): Promise<EquipmentRow> {
	assertMutationPayload("equipment", "update", input);
	const { paymentId, description, provider } = input;
	return toClient(
		await db.equipment.update({
			where: {
				paymentId,
			},
			data: {
				description,
				provider,
			},
			include: equipmentInclude,
		})
	);
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
