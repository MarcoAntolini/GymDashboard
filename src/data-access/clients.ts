"use server";

import { requireRole } from "@/lib/auth";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import {
	CLIENT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { Client } from "@prisma/client";

export async function createClient(input: Omit<Client, "id">) {
	await requireRole("Employee");
	assertAllowedMutation("clienti", "create", input);
	const {
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		enrollmentDate,
	} = input;
	return await db.client.create({
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			enrollmentDate,
		},
	});
}

export async function getAllClients() {
	await requireRole("Employee");
	return await db.client.findMany();
}

export async function getClient(id: number) {
	await requireRole("Employee");
	return await db.client.findUnique({
		where: {
			id,
		},
	});
}

export async function editClient(input: Client) {
	await requireRole("Employee");
	assertAllowedMutation("clienti", "update", input);
	const {
		id,
		taxCode,
		name,
		surname,
		birthDate,
		street,
		houseNumber,
		city,
		province,
		phoneNumber,
		email,
		enrollmentDate,
	} = input;
	return await db.client.update({
		where: {
			id,
		},
		data: {
			taxCode,
			name,
			surname,
			birthDate,
			street,
			houseNumber,
			city,
			province,
			phoneNumber,
			email,
			enrollmentDate,
		},
	});
}

export async function deleteClient({ id }: { id: number }) {
	await requireRole("Employee");
	try {
		return await db.client.delete({
			where: {
				id,
			},
		});
	} catch (error) {
		rethrowRestrictDelete(error, CLIENT_HAS_PURCHASES_MESSAGE);
	}
}
