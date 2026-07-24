"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import { Equipment } from "@prisma/client";

export async function createEquipment(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	assertMutationPayload("equipment", "create", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.create({
		data: {
			paymentId,
			description,
			provider,
		},
	});
}

export async function getAllEquipment() {
	return await db.equipment.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getEquipment(paymentId: number) {
	return await db.equipment.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editEquipment(input: Equipment) {
	assertMutationPayload("equipment", "update", input);
	const { paymentId, description, provider } = input;
	return await db.equipment.update({
		where: {
			paymentId,
		},
		data: {
			description,
			provider,
		},
	});
}

export async function deleteEquipment({ paymentId }: { paymentId: number }) {
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
