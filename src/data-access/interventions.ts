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
	INTERVENTION_DEFAULT_SORT,
	INTERVENTION_FILTER_ALLOWLIST,
	INTERVENTION_SORT_ALLOWLIST,
} from "@/lib/list/interventions";
import { Intervention, Prisma } from "@prisma/client";

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

function buildInterventionWhere(
	filters: ListFilters
): Prisma.InterventionWhereInput {
	const where: Prisma.InterventionWhereInput = {};

	const paymentId = parsePositiveIntFilter(filters.paymentId);
	if (paymentId !== undefined) where.paymentId = paymentId;

	const maker = filters.maker;
	if (typeof maker === "string") {
		const value = maker.trim();
		if (value) where.maker = { contains: value };
	}

	return where;
}

/**
 * Lista Interventi server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listInterventions(
	input: ListQueryInput = {}
): Promise<ListResult<Intervention>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: INTERVENTION_SORT_ALLOWLIST,
		filterAllowlist: INTERVENTION_FILTER_ALLOWLIST,
		defaultSort: [...INTERVENTION_DEFAULT_SORT],
	});
	const where = buildInterventionWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su PK (evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "paymentId" in o)
			? []
			: [{ paymentId: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.intervention.count({ where }),
		db.intervention.findMany({ where, skip, take, orderBy: orderByStable }),
	]);
	return buildListResult(items, total, query);
}

export async function createIntervention(input: {
	paymentId: number;
	description: string;
	maker: string;
	startingTime: Date;
	endingTime: Date;
}) {
	assertMutationPayload("intervention", "create", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.create({
		data: {
			paymentId,
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function getAllInterventions() {
	return await db.intervention.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getIntervention(paymentId: number) {
	return await db.intervention.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editIntervention(input: Intervention) {
	assertMutationPayload("intervention", "update", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.update({
		where: {
			paymentId,
		},
		data: {
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function deleteIntervention({ paymentId }: { paymentId: number }) {
	return await db.intervention.delete({
		where: {
			paymentId,
		},
	});
}
