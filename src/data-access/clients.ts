"use server";

import { db } from "@/lib/db";
import {
	CLIENT_HAS_PURCHASES_MESSAGE,
	rethrowRestrictDelete,
} from "@/lib/domain/restrict-delete";
import { Client } from "@prisma/client";

export async function createClient({
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
}: Omit<Client, "id">) {
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
	return await db.client.findMany();
}

export async function getClient(id: number) {
	return await db.client.findUnique({
		where: {
			id,
		},
	});
}

export async function editClient({
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
}: Client) {
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
