"use server";

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
	EQUIPMENT_DEFAULT_SORT,
	EQUIPMENT_FILTER_ALLOWLIST,
	EQUIPMENT_SORT_ALLOWLIST,
} from "@/lib/list/equipment";
import { Equipment, Prisma } from "@prisma/client";

const equipmentInclude = { payment: true } as const;

export type EquipmentRow = Prisma.EquipmentGetPayload<{
	include: typeof equipmentInclude;
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

function buildEquipmentWhere(filters: ListFilters): Prisma.EquipmentWhereInput {
	const where: Prisma.EquipmentWhereInput = {};

	const paymentId = parsePositiveIntFilter(filters.paymentId);
	if (paymentId !== undefined) where.paymentId = paymentId;

	const provider = filters.provider;
	if (typeof provider === "string") {
		const value = provider.trim();
		if (value) where.provider = { contains: value };
	}

	return where;
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
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "paymentId" in o)
			? []
			: [{ paymentId: "asc" as const }]),
	];
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
	return await db.equipment.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getEquipment(paymentId: number) {
	return await db.equipment.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editEquipment(input: Equipment): Promise<EquipmentRow> {
	assertMutationPayload("equipment", "update", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
		include: equipmentInclude,
	});
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
