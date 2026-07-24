"use server";

import { getCatalog } from "@/data-access/catalogs";
import { db } from "@/lib/db";
import { snapshotFromProduct } from "@/lib/domain/purchase-access";
import { Prisma } from "@prisma/client";

const PURCHASE_HAS_ENTRANCES_MESSAGE =
	"Impossibile eliminare l'acquisto: esistono ingressi collegati.";

const purchaseInclude = {
	client: true,
	prodotto: {
		include: { membership: true, entranceSet: true },
	},
} as const;

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

export async function createPurchase({
	clientId,
	date,
	amount,
	productCode,
}: PurchaseWriteInput) {
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
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			(error.code === "P2003" || error.code === "P2014")
		) {
			throw new Error(PURCHASE_HAS_ENTRANCES_MESSAGE);
		}
		throw error;
	}
}
