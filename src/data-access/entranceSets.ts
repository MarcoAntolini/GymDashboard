"use server";

import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { EntranceSet } from "@prisma/client";

export async function createEntranceSet(input: Omit<EntranceSet, "id">) {
	assertAllowedMutation("pacchetti_ingressi", "create", input);
	const { productCode, entranceNumber } = input;
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

export async function editEntranceSet(input: EntranceSet) {
	assertAllowedMutation("pacchetti_ingressi", "update", input);
	const { productCode, entranceNumber } = input;
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
