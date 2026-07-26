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
	MEMBERSHIP_DEFAULT_SORT,
	MEMBERSHIP_FILTER_ALLOWLIST,
	MEMBERSHIP_SORT_ALLOWLIST,
} from "@/lib/list/memberships";
import { Membership, Prisma } from "@prisma/client";

const membershipInclude = {
	product: true,
} as const;

export type MembershipListRow = Prisma.MembershipGetPayload<{
	include: typeof membershipInclude;
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

function buildMembershipWhere(filters: ListFilters): Prisma.MembershipWhereInput {
	const where: Prisma.MembershipWhereInput = {};

	const productCode = filters.productCode;
	if (typeof productCode === "string") {
		const value = productCode.trim();
		if (value) where.productCode = { contains: value };
	}

	const duration = parsePositiveIntFilter(filters.duration);
	if (duration !== undefined) where.duration = duration;

	return where;
}

/**
 * Lista Abbonamenti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listMemberships(
	input: ListQueryInput = {}
): Promise<ListResult<MembershipListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: MEMBERSHIP_SORT_ALLOWLIST,
		filterAllowlist: MEMBERSHIP_FILTER_ALLOWLIST,
		defaultSort: [...MEMBERSHIP_DEFAULT_SORT],
	});
	const where = buildMembershipWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su productCode (PK; evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "productCode" in o)
			? []
			: [{ productCode: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.membership.count({ where }),
		db.membership.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: membershipInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

export async function createMembership(input: Omit<Membership, "id">) {
	assertMutationPayload("membership", "create", input);
	const { productCode, duration } = input;
	await await db.product.create({
		data: {
			code: productCode,
		},
	});
	return await db.membership.create({
		data: {
			productCode,
			duration,
		},
		include: membershipInclude,
	});
}

export async function getAllMemberships() {
	return await db.membership.findMany({
		include: membershipInclude,
	});
}

export async function getMembership(productCode: string) {
	return await db.membership.findUnique({
		where: {
			productCode,
		},
		include: membershipInclude,
	});
}

export async function editMembership(input: Membership) {
	assertMutationPayload("membership", "update", input);
	const { productCode, duration } = input;
	return await db.membership.update({
		where: {
			productCode,
		},
		data: {
			duration,
		},
		include: membershipInclude,
	});
}

export async function deleteMembership({
	productCode,
}: {
	productCode: string;
}) {
	return await db.membership.delete({
		where: {
			productCode,
		},
	});
}
