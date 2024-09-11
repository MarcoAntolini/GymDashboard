"use server";

import { db } from "@/lib/db";
import { Payment, PaymentType } from "@prisma/client";

export async function createPayment({
  date,
  amount,
  type,
}: Omit<Payment, "id">) {
  return await db.payment.create({
    data: {
      date,
      amount,
      type,
    },
  });
}

export async function getAllPayments() {
  return await db.payment.findMany({
    include: {
      intervention: true,
      equipment: true,
      bill: true,
      salary: true,
    },
  });
}

export async function getPayment(id: number) {
  return await db.payment.findUnique({
    where: {
      id,
    },
    include: {
      intervention: true,
      equipment: true,
      bill: true,
      salary: true,
    },
  });
}

export async function editPayment({
  id,
  date,
  amount,
  type,
}: Payment) {
  return await db.payment.update({
    where: {
      id,
    },
    data: {
      date,
      amount,
      type,
    },
    include: {
      intervention: true,
      equipment: true,
      bill: true,
      salary: true,
    },
  });
}

export async function deletePayment({ id }: { id: number }) {
  return await db.payment.delete({
    where: {
      id,
    },
  });
}