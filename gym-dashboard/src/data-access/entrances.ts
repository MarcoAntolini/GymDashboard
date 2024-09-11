"use server";

import { db } from "@/lib/db";
import { Entrance } from "@prisma/client";

export async function createEntrance({
  clientId,
  date,
}: Omit<Entrance, "id">) {
  return await db.entrance.create({
    data: {
      clientId,
      date,
    },
  });
}

export async function getAllEntrances() {
  return await db.entrance.findMany({
    include: {
      client: true,
    },
  });
}

export async function getEntrance(clientId: number, date: Date) {
  return await db.entrance.findUnique({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
    include: {
      client: true,
    },
  });
}

export async function editEntrance({
  clientId,
  date,
}: Entrance) {
  return await db.entrance.update({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
    data: {
      date,
    },
  });
}

export async function deleteEntrance({ clientId, date }: { clientId: number; date: Date }) {
  return await db.entrance.delete({
    where: {
      clientId_date: {
        clientId,
        date,
      },
    },
  });
}