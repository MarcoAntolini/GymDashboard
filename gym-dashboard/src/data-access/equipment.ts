"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	buildWhere,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type ListQuery,
	type ListResult,
} from "@/lib/list-query";
import { Equipment, Prisma } from "@prisma/client";

function intFromTextFilter(filter: ColumnFilter): number | undefined {
	const value = textContains(filter);
	if (!value) return undefined;
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) ? parsed : undefined;
}

const equipmentFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.EquipmentWhereInput | undefined>
> = {
	paymentId: (filter) => {
		const id = intFromTextFilter(filter);
		return id != null ? { paymentId: id } : undefined;
	},
	provider: (filter) => {
		const value = textContains(filter);
		return value ? { provider: { contains: value } } : undefined;
	},
	description: (filter) => {
		const value = textContains(filter);
		return value ? { description: { contains: value } } : undefined;
	},
};

const equipmentSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.EquipmentOrderByWithRelationInput>
> = {
	paymentId: (desc) => ({ paymentId: desc ? "desc" : "asc" }),
	provider: (desc) => ({ provider: desc ? "desc" : "asc" }),
	description: (desc) => ({ description: desc ? "desc" : "asc" }),
};

export async function createEquipment({
	paymentId,
	description,
	provider,
}: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	return await db.equipment.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function listEquipment(rawQuery: ListQuery): Promise<ListResult<Equipment>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, equipmentFilterMap);
	const orderBy = resolveOrderBy(query.sort, equipmentSortMap, { paymentId: "desc" });

	const [total, items] = await Promise.all([
		db.equipment.count({ where }),
		db.equipment.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
		}),
	]);

	return { items, total };
}

export async function getEquipment(paymentId: number) {
	await requireRole("Employee");
	return await db.equipment.findUnique({
		where: {
			paymentId,
		},
	});
}

export async function editEquipment({ paymentId, description, provider }: Equipment) {
	await requireRole("Employee");
	return await db.equipment.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	await requireRole("Employee");
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
