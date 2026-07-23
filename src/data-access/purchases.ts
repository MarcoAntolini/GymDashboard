"use server";

import { formatCatalogPrice } from "@/lib/domain/catalog-price";
import {
	catalogYearFromDate,
	resolvePurchaseAmountString,
} from "@/lib/domain/purchase-amount";
import { remainingEntrancesForPurchase } from "@/lib/domain/purchase-snapshot";
import {
	PURCHASE_HAS_ENTRANCES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { db } from "@/lib/db";
import { Prisma, Purchase } from "@prisma/client";
import { getCatalog } from "./catalogs";

export type PurchaseWithSnapshot = Omit<Purchase, "amount"> & {
	/** Always a 2-decimal string for forms/display (Decimal end-to-end via Prisma write). */
	amount: string;
	/** Residuo pacchetto from Acquisto snapshot; null for memberships. */
	remainingEntrances: number | null;
	client?: { id: number; name: string; surname: string };
	prodotto?: {
		code: string;
		membership: { duration: number } | null;
		entranceSet: { entranceNumber: number } | null;
	};
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
export async function createPurchase({
	clientId,
	date,
	amount,
	productCode,
}: CreatePurchaseInput) {
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

export async function getAllPurchases(): Promise<PurchaseWithSnapshot[]> {
	const purchases = await db.purchase.findMany({
		include: {
			client: true,
			prodotto: { include: { membership: true, entranceSet: true } },
			_count: { select: { entrances: true } },
		},
		orderBy: [{ date: "desc" }, { id: "desc" }],
	});
	return purchases.map(withRemaining);
}

export async function getPurchase(id: number) {
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
	amount: string | number | Prisma.Decimal;
	productCode: string;
};

/**
 * Edit mutable fields only. Snapshot durata / numero_ingressi are never rewritten
 * (not even when the live Prodotto duration/N changes).
 */
export async function editPurchase({
	id,
	clientId,
	date,
	amount,
	productCode,
}: EditPurchaseInput) {
	const amountString = resolvePurchaseAmountString(
		typeof amount === "string" ? amount : String(amount),
		null
	);

	const updated = await db.purchase.update({
		where: { id },
		data: {
			clientId,
			date,
			amount: new Prisma.Decimal(amountString),
			productCode,
			// intentionally omit duration / entranceNumber — sale snapshot is immutable
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
