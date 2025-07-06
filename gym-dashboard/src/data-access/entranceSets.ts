"use server";

import { db } from "@/lib/db";
import { EntranceSet } from "@prisma/client";

export async function createEntranceSet({ productCode, entranceNumber }: Omit<EntranceSet, "id">) {
	await await db.product.create({
		data: {
			code: productCode
		}
	});
	return db.entranceSet.create({
		data: {
			productCode,
			entranceNumber
		},
		include: {
			product: true
		}
	});
}

export async function getAllEntranceSets() {
	return await db.entranceSet.findMany({
		include: {
			product: true
		}
	});
}

export async function getEntranceSet(productCode: string) {
	return await db.entranceSet.findUnique({
		where: {
			productCode
		},
		include: {
			product: true
		}
	});
}

export async function editEntranceSet({ productCode, entranceNumber }: EntranceSet) {
	return await db.entranceSet.update({
		where: {
			productCode
		},
		data: {
			entranceNumber
		},
		include: {
			product: true
		}
	});
}

export async function deleteEntranceSet({ productCode }: { productCode: string }) {
	return await db.entranceSet.delete({
		where: {
			productCode
		}
	});
}
