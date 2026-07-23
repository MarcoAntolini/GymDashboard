"use server";

import { db } from "@/lib/db";
import { remainingEntrancesForPurchase } from "@/lib/domain/purchase-snapshot";
import { Prisma, Purchase } from "@prisma/client";

export type PurchaseWithSnapshot = Purchase & {
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
	amount: number | Prisma.Decimal;
	productCode: string;
};

/**
 * Create Acquisto: copy durata / numero_ingressi from the Prodotto specialization
 * at sale time. Later product edits must not rewrite these columns.
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

	const created = await db.purchase.create({
		data: {
			clientId,
			date,
			amount,
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
	amount: number | Prisma.Decimal;
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
	const updated = await db.purchase.update({
		where: { id },
		data: {
			clientId,
			date,
			amount,
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
	return await db.purchase.delete({
		where: { id },
	});
}

function withRemaining<
	T extends {
		entranceNumber: number | null;
		_count?: { entrances: number };
	},
>(purchase: T): T & { remainingEntrances: number | null } {
	const used = purchase._count?.entrances ?? 0;
	return {
		...purchase,
		remainingEntrances: remainingEntrancesForPurchase(purchase, used),
	};
}
