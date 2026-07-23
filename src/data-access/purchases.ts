"use server";

import { requireRole } from "@/lib/auth";
import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import { listEmptyKind } from "@/lib/domain/list-query";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import {
	catalogYearFromDate,
	resolvePurchaseAmountString,
} from "@/lib/domain/purchase-amount";
import {
	PURCHASE_LIST_DEFAULT_SORT,
	PURCHASE_LIST_SORT_COLUMNS,
	buildPurchaseListOrderBy,
	buildPurchaseListWhere,
	purchaseListHasActiveFilters,
} from "@/lib/domain/purchase-list-query";
import { remainingEntrancesForPurchase } from "@/lib/domain/purchase-snapshot";
import {
	PURCHASE_HAS_ENTRANCES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { db } from "@/lib/db";
import {
	runListQuery,
	toPrismaSkipTake,
	type ListQueryInput,
	type ListQueryResult,
} from "@/data-access/list-query";
import { Prisma, Purchase } from "@prisma/client";
import { getCatalog } from "./catalogs";

/**
 * Acquisto list/detail DTO — column classes (see VIEW_COLUMN_MATRIX.acquisti):
 * - nativa: id, clientId, date, productCode
 * - snapshot: amount, duration, entranceNumber
 * - derivata: remainingEntrances (never persisted)
 * - join: client, prodotto
 */
export type PurchaseWithSnapshot = Omit<Purchase, "amount"> & {
	/** snapshot — 2-decimal string for forms/display (Decimal end-to-end via Prisma write). */
	amount: string;
	/** derivata — residuo pacchetto from Acquisto snapshot N − COUNT; null for memberships. */
	remainingEntrances: number | null;
	/** join — Cliente label */
	client?: { id: number; name: string; surname: string };
	/** join — live Prodotto + ISA (not written back as tipo on Acquisto) */
	prodotto?: {
		code: string;
		membership: { duration: number } | null;
		entranceSet: { entranceNumber: number } | null;
	};
	/** internal aggregate for remainingEntrances; not a list column */
	_count?: { entrances: number };
};

type CreatePurchaseInput = {
	clientId: number;
	date: Date;
	/** Override sconto; if omitted/empty, snapshot from Listino (YEAR(date), productCode). */
	amount?: string | number | Prisma.Decimal | null;
	productCode: string;
};

/**
 * Create Acquisto: copy durata / numero_ingressi from the Prodotto specialization
 * at sale time. Importo defaults to Listino for YEAR(date)+productCode when omitted.
 * Later product/listino edits must not rewrite these columns.
 */
export async function createPurchase(input: CreatePurchaseInput) {
	await requireRole("Employee");
	assertAllowedMutation("acquisti", "create", input);
	const { clientId, date, amount, productCode } = input;
	const product = await db.product.findUnique({
		where: { code: productCode },
		include: { membership: true, entranceSet: true },
	});
	if (!product) {
		throw new Error(`Prodotto non trovato: ${productCode}`);
	}
	if (product.membership && product.entranceSet) {
		throw new Error(`Prodotto ${productCode} ha entrambe le specializzazioni`);
	}
	if (!product.membership && !product.entranceSet) {
		throw new Error(`Prodotto ${productCode} senza Abbonamento né Pacchetto`);
	}

	const duration = product.membership?.duration ?? null;
	const entranceNumber = product.entranceSet?.entranceNumber ?? null;

	const override =
		amount == null ? undefined : typeof amount === "string" ? amount : String(amount);
	const catalog = await getCatalog(catalogYearFromDate(date), productCode);
	const amountString = resolvePurchaseAmountString(override, catalog?.price ?? null);

	const created = await db.purchase.create({
		data: {
			clientId,
			date,
			amount: new Prisma.Decimal(amountString),
			productCode,
			duration,
			entranceNumber,
		},
		include: {
			client: true,
			prodotto: { include: { membership: true, entranceSet: true } },
			_count: { select: { entrances: true } },
		},
	});

	return withRemaining(created);
}

const purchaseInclude = {
	client: true,
	prodotto: { include: { membership: true, entranceSet: true } },
	_count: { select: { entrances: true } },
} satisfies Prisma.PurchaseInclude;

export type PurchaseListResult = ListQueryResult<PurchaseWithSnapshot> & {
	/** Count with no filters — for empty-state kind (dataset vs filters). */
	totalUnfiltered: number;
	emptyKind: ReturnType<typeof listEmptyKind>;
};

/**
 * Server-side Acquisti list (ticket 22): filters + ORDER BY + LIMIT/OFFSET.
 * Call only on Filtra / sort / page change — not on every keystroke.
 */
export async function listPurchases(
	input: ListQueryInput
): Promise<PurchaseListResult> {
	await requireRole("Employee");

	let totalUnfiltered = 0;

	const result = await runListQuery(
		input,
		async (params) => {
			const where = buildPurchaseListWhere(
				params.filters
			) as Prisma.PurchaseWhereInput;
			const orderBy = buildPurchaseListOrderBy(
				params.sort
			) as Prisma.PurchaseOrderByWithRelationInput[];
			const skipTake = toPrismaSkipTake(params);

			const needsUnfiltered = purchaseListHasActiveFilters(params.filters);

			const [rows, total, unfiltered] = await Promise.all([
				db.purchase.findMany({
					where,
					include: purchaseInclude,
					orderBy,
					...skipTake,
				}),
				db.purchase.count({ where }),
				needsUnfiltered
					? db.purchase.count()
					: Promise.resolve(null as number | null),
			]);

			totalUnfiltered = unfiltered ?? total;
			return { rows: rows.map(withRemaining), total };
		},
		{
			allowedSortColumns: PURCHASE_LIST_SORT_COLUMNS,
			defaultSort: PURCHASE_LIST_DEFAULT_SORT,
		}
	);

	return {
		...result,
		totalUnfiltered,
		emptyKind: listEmptyKind({
			totalUnfiltered,
			total: result.total,
			rowCount: result.rows.length,
		}),
	};
}

/** Full table — prefer {@link listPurchases} for the Acquisti page list. */
export async function getAllPurchases(): Promise<PurchaseWithSnapshot[]> {
	await requireRole("Employee");
	const purchases = await db.purchase.findMany({
		include: purchaseInclude,
		orderBy: [{ date: "desc" }, { id: "desc" }],
	});
	return purchases.map(withRemaining);
}

export async function getPurchase(id: number) {
	await requireRole("Employee");
	const purchase = await db.purchase.findUnique({
		where: { id },
		include: {
			client: true,
			prodotto: { include: { membership: true, entranceSet: true } },
			_count: { select: { entrances: true } },
		},
	});
	return purchase ? withRemaining(purchase) : null;
}

type EditPurchaseInput = {
	id: number;
	clientId: number;
	date: Date;
};

/**
 * Edit mutable fields only. Snapshot amount / durata / N and productCode are
 * immutable after sale (see MUTATION_FIELD_MATRIX.acquisti + edge cases).
 */
export async function editPurchase(input: EditPurchaseInput) {
	await requireRole("Employee");
	assertAllowedMutation("acquisti", "update", input);
	const { id, clientId, date } = input;

	const updated = await db.purchase.update({
		where: { id },
		data: {
			clientId,
			date,
			// intentionally omit amount / productCode / duration / entranceNumber
		},
		include: {
			client: true,
			prodotto: { include: { membership: true, entranceSet: true } },
			_count: { select: { entrances: true } },
		},
	});
	return withRemaining(updated);
}

export async function deletePurchase({ id }: { id: number }) {
	await requireRole("Employee");
	try {
		return await db.purchase.delete({
			where: { id },
		});
	} catch (error) {
		rethrowRestrictDelete(error, PURCHASE_HAS_ENTRANCES_MESSAGE);
	}
}

function withRemaining<
	T extends {
		amount: string | number | { toFixed: (digits: number) => string };
		entranceNumber: number | null;
		_count?: { entrances: number };
	},
>(purchase: T): Omit<T, "amount"> & {
	amount: string;
	remainingEntrances: number | null;
} {
	const used = purchase._count?.entrances ?? 0;
	return {
		...purchase,
		amount: formatCatalogPrice(purchase.amount),
		remainingEntrances: remainingEntrancesForPurchase(purchase, used),
	};
}
