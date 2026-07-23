"use server";

import { db } from "@/lib/db";
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
  remainingEntrances,
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
      remainingEntrances,
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
  remainingEntrances,
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
      remainingEntrances,
    },
  });
}

export async function deleteClient({ id }: { id: number }) {
  return await db.client.delete({
    where: {
      id,
    },
  });
}