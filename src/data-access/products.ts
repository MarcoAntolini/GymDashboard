"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { throwIfRestrictViolation } from "@/lib/domain/prisma-restrict";
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
	PRODUCT_DEFAULT_SORT,
	PRODUCT_FILTER_ALLOWLIST,
	PRODUCT_SORT_ALLOWLIST,
} from "@/lib/list/products";
import {
	ProductKind,
	productKindFromProduct,
} from "@/lib/domain/product-kind";
import { Prisma } from "@prisma/client";

const PRODUCT_HAS_DEPENDENTS_MESSAGE =
	"Impossibile eliminare il Prodotto: esistono Vendite o voci di Listino collegate (vincolo Restrict).";

const productInclude = {
	membership: true,
	entranceSet: true,
} as const;

type ProductRecord = Prisma.ProductGetPayload<{
	include: typeof productInclude;
}>;

export type ProductListRow = ProductRecord & {
	kind: ProductKind | null;
	detail: number | null;
};

export type ProductWriteInput = {
	code: string;
	description: string;
	active: boolean;
	kind: ProductKind;
	detail: number;
};

function toProductListRow(product: ProductRecord): ProductListRow {
	const kind = productKindFromProduct(product);
	return {
		...product,
		kind,
		detail:
			kind === ProductKind.Membership
				? product.membership?.duration ?? null
				: kind === ProductKind.EntranceSet
					? product.entranceSet?.entranceNumber ?? null
					: null,
	};
}

function buildProductWhere(filters: ListFilters): Prisma.ProductWhereInput {
	const where: Prisma.ProductWhereInput = {};
	const code = filters.code;
	if (typeof code === "string") {
		const value = code.trim();
		if (value) where.code = { contains: value };
	}
	const description = filters.description;
	if (typeof description === "string") {
		const value = description.trim();
		if (value) where.description = { contains: value };
	}
	const rawActive = Array.isArray(filters.active)
		? filters.active
		: typeof filters.active === "string"
			? [filters.active]
			: [];
	if (rawActive.length === 1) {
		where.active = rawActive[0] === "true";
	}
	const rawKinds = Array.isArray(filters.kind)
		? filters.kind
		: typeof filters.kind === "string"
			? [filters.kind]
			: [];
	const kindConditions: Prisma.ProductWhereInput[] = [];
	if (rawKinds.includes(ProductKind.Membership)) {
		kindConditions.push({ membership: { isNot: null } });
	}
	if (rawKinds.includes(ProductKind.EntranceSet)) {
		kindConditions.push({ entranceSet: { isNot: null } });
	}
	if (kindConditions.length) where.OR = kindConditions;
	return where;
}

/**
 * Lista Prodotti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listProducts(
	input: ListQueryInput = {}
): Promise<ListResult<ProductListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: PRODUCT_SORT_ALLOWLIST,
		filterAllowlist: PRODUCT_FILTER_ALLOWLIST,
		defaultSort: [...PRODUCT_DEFAULT_SORT],
	});
	const where = buildProductWhere(query.filters);
	const { skip, take, orderBy } = toPrismaListArgs(query);
	// Tie-break stabile su code (PK stringa; evita overlap OFFSET con sort non unico).
	const orderByStable = [
		...(orderBy ?? []),
		...(orderBy?.some((o) => "code" in o) ? [] : [{ code: "asc" as const }]),
	];
	const [total, items] = await Promise.all([
		db.product.count({ where }),
		db.product.findMany({
			where,
			skip,
			take,
			orderBy: orderByStable,
			include: productInclude,
		}),
	]);
	return buildListResult(items.map(toProductListRow), total, query);
}

export async function createProduct(input: ProductWriteInput) {
	assertMutationPayload("product", "create", input);
	const { code, description, active, kind, detail } = input;
	const product = await db.product.create({
		data: {
			code,
			description,
			active,
			membership:
				kind === ProductKind.Membership
					? { create: { duration: detail } }
					: undefined,
			entranceSet:
				kind === ProductKind.EntranceSet
					? { create: { entranceNumber: detail } }
					: undefined,
		},
		include: productInclude,
	});
	return toProductListRow(product);
}

export async function getAllProducts() {
	return await db.product.findMany({
		include: productInclude,
	});
}

export async function getProduct(code: string) {
	return await db.product.findUnique({
		where: {
			code,
		},
		include: productInclude,
	});
}

export async function editProduct(input: ProductWriteInput) {
	assertMutationPayload("product", "update", input);
	const { code, description, active, kind, detail } = input;
	const updated = await db.$transaction(async (tx) => {
		const current = await tx.product.findUnique({
			where: { code },
			include: productInclude,
		});
		if (!current) throw new Error(`Prodotto non trovato: ${code}`);
		if (productKindFromProduct(current) !== kind) {
			throw new Error("Il tipo del Prodotto non può essere modificato");
		}
		await tx.product.update({
			where: { code },
			data: { description, active },
		});
		if (kind === ProductKind.Membership) {
			await tx.membership.update({
				where: { productCode: code },
				data: { duration: detail },
			});
		} else {
			await tx.entranceSet.update({
				where: { productCode: code },
				data: { entranceNumber: detail },
			});
		}
		return tx.product.findUniqueOrThrow({
			where: { code },
			include: productInclude,
		});
	});
	return toProductListRow(updated);
}

export async function deleteProduct({ code }: { code: string }) {
	try {
		return await db.product.delete({
			where: {
				code,
			},
		});
	} catch (error) {
		throwIfRestrictViolation(error, PRODUCT_HAS_DEPENDENTS_MESSAGE);
	}
}
