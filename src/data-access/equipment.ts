"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Equipment } from "@prisma/client";

export async function createEquipment(input: {
	paymentId: number;
	description: string;
	provider: string;
}) {
	await requireRole("Employee");
	assertAllowedMutation("attrezzatura", "create", input);
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
	await requireRole("Employee");
	return await db.equipment.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getEquipment(paymentId: number) {
	await requireRole("Employee");
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
	await requireRole("Employee");
	assertAllowedMutation("attrezzatura", "update", input);
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
	await requireRole("Employee");
	return await db.equipment.delete({
		where: {
			paymentId,
		},
	});
}
