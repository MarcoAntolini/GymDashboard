"use server";

import { db } from "@/lib/db";
import { snapshotFromProduct } from "@/lib/domain/purchase-access";
import { Prisma } from "@prisma/client";

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

export async function createPurchase({
	clientId,
	date,
	amount,
	productCode,
}: PurchaseWriteInput) {
	const snapshot = await resolveSnapshot(productCode);
	return await db.purchase.create({
		data: {
			clientId,
			date,
			amount,
			productCode,
			duration: snapshot.duration,
			entranceNumber: snapshot.entranceNumber,
		},
		include: {
			client: true,
			prodotto: {
				include: { membership: true, entranceSet: true },
			},
		},
	});
}

export async function getAllPurchases() {
	return await db.purchase.findMany({
		include: {
			client: true,
			prodotto: {
				include: { membership: true, entranceSet: true },
			},
		},
	});
}

/** Lookup legacy (clientId+date) — ticket 05 passerà a id surrogato. */
export async function getPurchase(clientId: number, date: Date) {
	return await db.purchase.findFirst({
		where: { clientId, date },
		include: {
			client: true,
			prodotto: {
				include: { membership: true, entranceSet: true },
			},
		},
	});
}

export async function editPurchase({
	id,
	clientId,
	date,
	amount,
	productCode,
}: PurchaseWriteInput & { id: number }) {
	const snapshot = await resolveSnapshot(productCode);
	return await db.purchase.update({
		where: { id },
		data: {
			clientId,
			date,
			amount,
			productCode,
			// Re-snapshot se cambia il prodotto; durata/N non sono campi editabili a mano.
			duration: snapshot.duration,
			entranceNumber: snapshot.entranceNumber,
		},
		include: {
			client: true,
			prodotto: {
				include: { membership: true, entranceSet: true },
			},
		},
	});
}

/** Accetta id (preferito) o coppia legacy clientId+date (UI pre-ticket 05). */
export async function deletePurchase(
	key: { id: number } | { clientId: number; date: Date }
) {
	if ("id" in key) {
		return await db.purchase.delete({ where: { id: key.id } });
	}
	const existing = await db.purchase.findFirst({
		where: { clientId: key.clientId, date: key.date },
	});
	if (!existing) {
		throw new Error("Acquisto non trovato");
	}
	return await db.purchase.delete({ where: { id: existing.id } });
}
