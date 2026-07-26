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
	ENTRANCE_SET_DEFAULT_SORT,
	ENTRANCE_SET_FILTER_ALLOWLIST,
	ENTRANCE_SET_SORT_ALLOWLIST,
} from "@/lib/list/entranceSets";
import { EntranceSet, Prisma } from "@prisma/client";

const entranceSetInclude = {
	product: true,
} as const;

export type EntranceSetListRow = Prisma.EntranceSetGetPayload<{
	include: typeof entranceSetInclude;
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

function buildEntranceSetWhere(filters: ListFilters): Prisma.EntranceSetWhereInput {
	const where: Prisma.EntranceSetWhereInput = {};

	const productCode = filters.productCode;
	if (typeof productCode === "string") {
		const value = productCode.trim();
		if (value) where.productCode = { contains: value };
	}

	const entranceNumber = parsePositiveIntFilter(filters.entranceNumber);
	if (entranceNumber !== undefined) where.entranceNumber = entranceNumber;

	return where;
}

/**
 * Lista Pacchetti ingressi server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listEntranceSets(
	input: ListQueryInput = {}
): Promise<ListResult<EntranceSetListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: ENTRANCE_SET_SORT_ALLOWLIST,
		filterAllowlist: ENTRANCE_SET_FILTER_ALLOWLIST,
		defaultSort: [...ENTRANCE_SET_DEFAULT_SORT],
	});
	const where = buildEntranceSetWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su productCode (PK; evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "productCode" in o)
			? []
			: [{ productCode: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.entranceSet.count({ where }),
		db.entranceSet.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: entranceSetInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createEntranceSet(input: Omit<EntranceSet, "id">) {
	assertMutationPayload("entranceSet", "create", input);
	const { productCode, entranceNumber } = input;
	await db.product.create({
		data: {
			code: productCode,
		},
	});
	return await db.entranceSet.create({
		data: {
			productCode,
			entranceNumber,
		},
		include: entranceSetInclude,
	});
}

export async function getAllEntranceSets() {
	return await db.entranceSet.findMany({
		include: entranceSetInclude,
	});
}

export async function getEntranceSet(productCode: string) {
	return await db.entranceSet.findUnique({
		where: {
			productCode,
		},
		include: entranceSetInclude,
	});
}

export async function editEntranceSet(input: EntranceSet) {
	assertMutationPayload("entranceSet", "update", input);
	const { productCode, entranceNumber } = input;
	return await db.entranceSet.update({
		where: {
			productCode,
		},
		data: {
			entranceNumber,
		},
		include: entranceSetInclude,
	});
}

export async function deleteEntranceSet({
	productCode,
}: {
	productCode: string;
}) {
	return await db.entranceSet.delete({
		where: {
			productCode,
		},
	});
}
