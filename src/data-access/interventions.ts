"use server";

import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Intervention } from "@prisma/client";

export async function createIntervention(input: {
	paymentId: number;
	description: string;
	maker: string;
	startingTime: Date;
	endingTime: Date;
}) {
	assertAllowedMutation("interventi", "create", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.create({
		data: {
			paymentId,
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function getAllInterventions() {
	return await db.intervention.findMany({
		include: {
			payment: true,
		},
	});
}

export async function getIntervention(paymentId: number) {
	return await db.intervention.findUnique({
		where: {
			paymentId,
		},
		include: {
			payment: true,
		},
	});
}

export async function editIntervention(input: Intervention) {
	assertAllowedMutation("interventi", "update", input);
	const { paymentId, description, maker, startingTime, endingTime } = input;
	return await db.intervention.update({
		where: {
			paymentId,
		},
		data: {
			description,
			maker,
			startingTime,
			endingTime,
		},
	});
}

export async function deleteIntervention({ paymentId }: { paymentId: number }) {
	return await db.intervention.delete({
		where: {
			paymentId,
		},
	});
}
