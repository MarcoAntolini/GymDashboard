"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { EntranceSet } from "@prisma/client";

export async function createEntranceSet(input: Omit<EntranceSet, "id">) {
	assertMutationPayload("entranceSet", "create", input);
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
	assertMutationPayload("entranceSet", "update", input);
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
