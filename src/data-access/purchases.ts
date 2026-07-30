"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { getCatalog } from "@/data-access/catalogs";
import { db } from "@/lib/db";
import {
	PRODUCT_KIND_LABEL,
	ProductKind,
	productKindFromSnapshot,
} from "@/lib/domain/product-kind";
import { throwIfRestrictViolation } from "@/lib/domain/prisma-restrict";
import { snapshotFromProduct } from "@/lib/domain/purchase-access";
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
	PURCHASE_DEFAULT_SORT,
	PURCHASE_FILTER_ALLOWLIST,
	PURCHASE_SORT_ALLOWLIST,
} from "@/lib/list/purchases";
import {
	aggregateByPeriod,
	normalizeInclusiveRange,
	periodKeyForDate,
	type PeriodPoint,
	type PeriodType,
} from "@/lib/period-aggregation";
import {
	rankProductsByRevenue,
	type ProductRankingRow,
} from "@/lib/product-ranking";
import { Prisma } from "@prisma/client";

const PURCHASE_HAS_ENTRANCES_MESSAGE =
	"Impossibile eliminare l'Acquisto: esistono Ingressi collegati (vincolo Restrict).";

const purchaseInclude = {
	client: true,
	prodotto: {
		include: { membership: true, entranceSet: true },
	},
} as const;

export type PurchaseListRow = Prisma.PurchaseGetPayload<{
	include: typeof purchaseInclude;
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

function buildPurchaseWhere(filters: ListFilters): Prisma.PurchaseWhereInput {
	const where: Prisma.PurchaseWhereInput = {};
	const and: Prisma.PurchaseWhereInput[] = [];

	const id = parsePositiveIntFilter(filters.id);
	if (id !== undefined) where.id = id;

	const clientId = parsePositiveIntFilter(filters.clientId);
	if (clientId !== undefined) where.clientId = clientId;

	const client = filters.client;
	if (typeof client === "string") {
		const value = client.trim();
		if (value) {
			and.push({
				client: {
					OR: [
						{ surname: { contains: value } },
						{ name: { contains: value } },
					],
				},
			});
		}
	}

	const productCode = filters.productCode;
	if (typeof productCode === "string") {
		const value = productCode.trim();
		if (value) {
			and.push({ productCode: { contains: value } });
		}
	}

	const rawTypes = Array.isArray(filters.type)
		? filters.type
		: typeof filters.type === "string"
			? [filters.type]
			: [];
	const selectedTypes = new Set(
		rawTypes.filter(
			(value): value is ProductKind =>
				value === ProductKind.Membership || value === ProductKind.EntranceSet
		)
	);
	if (selectedTypes.size === 1) {
		where.duration = selectedTypes.has(ProductKind.Membership)
			? { not: null }
			: null;
	}

	if (and.length) where.AND = and;
	return where;
}

function buildPurchaseOrderBy(
	sort: ListSort[]
): Prisma.PurchaseOrderByWithRelationInput[] {
	const orderBy: Prisma.PurchaseOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "id":
				orderBy.push({ id: dir });
				break;
			case "date":
				orderBy.push({ date: dir });
				break;
			case "clientId":
				orderBy.push({ clientId: dir });
				break;
			case "productCode":
				orderBy.push({ productCode: dir });
				break;
			case "amount":
				orderBy.push({ amount: dir });
				break;
			case "duration":
				orderBy.push({ duration: dir });
				break;
			case "entranceNumber":
				orderBy.push({ entranceNumber: dir });
				break;
			case "client":
				orderBy.push({ client: { surname: dir } });
				orderBy.push({ client: { name: dir } });
				break;
			default:
				break;
		}
	}
	if (!orderBy.some((o) => "id" in o)) {
		orderBy.push({ id: "asc" });
	}
	return orderBy;
}

/**
 * Lista Acquisti server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listPurchases(
	input: ListQueryInput = {}
): Promise<ListResult<PurchaseListRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: PURCHASE_SORT_ALLOWLIST,
		filterAllowlist: PURCHASE_FILTER_ALLOWLIST,
		defaultSort: [...PURCHASE_DEFAULT_SORT],
	});
	const where = buildPurchaseWhere(query.filters);
	const { skip, take } = toPrismaPage(query);
	const orderBy = buildPurchaseOrderBy(query.sort);
	const [total, items] = await Promise.all([
		db.purchase.count({ where }),
		db.purchase.findMany({
			where,
			skip,
			take,
			orderBy,
			include: purchaseInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

type PurchaseWriteInput = {
	clientId: number;
	date: Date;
	amount: Prisma.Decimal | number | string;
	productCode: string;
};

async function resolveSnapshot(productCode: string) {
	const product = await db.product.findUnique({
		where: { code: productCode },
		include: { membership: true, entranceSet: true },
	});
	if (!product) {
		throw new Error(`Prodotto non trovato: ${productCode}`);
	}
	return snapshotFromProduct(product);
}

function isEmptyAmount(amount: PurchaseWriteInput["amount"] | null | undefined) {
	if (amount == null) return true;
	if (typeof amount === "string") return amount.trim() === "";
	return false;
}

async function resolveAmount(
	date: Date,
	productCode: string,
	amount: PurchaseWriteInput["amount"] | null | undefined
): Promise<Prisma.Decimal> {
	if (!isEmptyAmount(amount)) {
		return new Prisma.Decimal(amount as string | number | Prisma.Decimal);
	}
	const catalog = await getCatalog(date.getFullYear(), productCode);
	if (!catalog) {
		throw new Error(
			`Nessun prezzo listino per ${productCode} nell'anno ${date.getFullYear()}; indicare un importo.`
		);
	}
	return new Prisma.Decimal(catalog.price);
}

export async function createPurchase(input: PurchaseWriteInput) {
	assertMutationPayload("purchase", "create", input);
	const { clientId, date, amount, productCode } = input;
	const snapshot = await resolveSnapshot(productCode);
	const resolvedAmount = await resolveAmount(date, productCode, amount);
	return await db.purchase.create({
		data: {
			clientId,
			date,
			amount: resolvedAmount,
			productCode,
			duration: snapshot.duration,
			entranceNumber: snapshot.entranceNumber,
		},
		include: purchaseInclude,
	});
}

export async function getAllPurchases() {
	return await db.purchase.findMany({
		include: purchaseInclude,
	});
}

export async function getPurchase(id: number) {
	return await db.purchase.findUnique({
		where: { id },
		include: purchaseInclude,
	});
}

export async function editPurchase(input: PurchaseWriteInput & { id: number }) {
	assertMutationPayload("purchase", "update", input);
	const { id, clientId, date, amount, productCode } = input;
	const snapshot = await resolveSnapshot(productCode);
	return await db.purchase.update({
		where: { id },
		data: {
			clientId,
			date,
			amount: new Prisma.Decimal(amount),
			productCode,
			// Re-snapshot se cambia il prodotto; durata/N non sono campi editabili a mano.
			duration: snapshot.duration,
			entranceNumber: snapshot.entranceNumber,
		},
		include: purchaseInclude,
	});
}

export async function deletePurchase({ id }: { id: number }) {
	try {
		return await db.purchase.delete({ where: { id } });
	} catch (error) {
		throwIfRestrictViolation(error, PURCHASE_HAS_ENTRANCES_MESSAGE);
	}
}

export type EntratePeriodPoint = PeriodPoint & {
	/** Alias esplicito per chart Entrate (importo EUR). */
	totalAmount: number;
	count: number;
};

/**
 * Entrate (Acquisti) aggregate per granularità di periodo:
 * giornaliero / settimanale / mensile / annuale.
 */
export async function getEntrateByPeriod(
	startDate: Date,
	endDate: Date,
	periodType: PeriodType
): Promise<EntratePeriodPoint[]> {
	const { from, to } = normalizeInclusiveRange(startDate, endDate);
	const rows = await db.purchase.findMany({
		where: {
			date: {
				gte: from,
				lte: to,
			},
		},
		select: { date: true, amount: true },
	});

	const amountSeries = aggregateByPeriod(
		rows,
		(row) => row.date,
		from,
		to,
		periodType,
		(row) => Number(row.amount)
	);
	const countByKey = new Map<string, number>();
	for (const row of rows) {
		const key = periodKeyForDate(row.date, periodType);
		countByKey.set(key, (countByKey.get(key) ?? 0) + 1);
	}

	return amountSeries.map((point) => ({
		...point,
		totalAmount: point.value,
		count: countByKey.get(point.key) ?? 0,
	}));
}

export type ProductMixForPeriod = {
	byKind: { key: ProductKind; label: string; amount: number; count: number }[];
	ranking: ProductRankingRow[];
};

/**
 * Mix Abbonamenti vs Pacchetti + ranking prodotti (ricavo, quantità) su intervallo date.
 */
export async function getProductMixForPeriod(
	startDate: Date,
	endDate: Date
): Promise<ProductMixForPeriod> {
	const { from, to } = normalizeInclusiveRange(startDate, endDate);
	const rows = await db.purchase.findMany({
		where: { date: { gte: from, lte: to } },
		select: { amount: true, productCode: true, duration: true, entranceNumber: true },
	});

	const kindOrder: ProductKind[] = [ProductKind.Membership, ProductKind.EntranceSet];
	const byKindMap = new Map<ProductKind, { amount: number; count: number }>(
		kindOrder.map((kind) => [kind, { amount: 0, count: 0 }])
	);
	const rankingInput: {
		productCode: string;
		amount: number;
		duration: number | null;
		entranceNumber: number | null;
	}[] = [];

	for (const row of rows) {
		const amount = Number(row.amount);
		const kind = productKindFromSnapshot(row);
		const bucket = byKindMap.get(kind) ?? { amount: 0, count: 0 };
		bucket.amount += amount;
		bucket.count += 1;
		byKindMap.set(kind, bucket);
		rankingInput.push({
			productCode: row.productCode,
			amount,
			duration: row.duration,
			entranceNumber: row.entranceNumber,
		});
	}

	return {
		byKind: kindOrder.map((kind) => {
			const bucket = byKindMap.get(kind) ?? { amount: 0, count: 0 };
			return {
				key: kind,
				label: PRODUCT_KIND_LABEL[kind],
				amount: bucket.amount,
				count: bucket.count,
			};
		}),
		ranking: rankProductsByRevenue(rankingInput),
	};
}
