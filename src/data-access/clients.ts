"use server";

import { db } from "@/lib/db";
import { Client, Prisma } from "@prisma/client";

const CLIENT_HAS_PURCHASES_MESSAGE =
	"Impossibile eliminare il cliente: esistono acquisti collegati.";

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
		if (
			error instanceof Prisma.PrismaClientKnownRequestError &&
			(error.code === "P2003" || error.code === "P2014")
		) {
			throw new Error(CLIENT_HAS_PURCHASES_MESSAGE);
		}
		throw error;
	}
}