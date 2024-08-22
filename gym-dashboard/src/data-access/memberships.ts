"use server";

import { db } from "@/lib/db";
import { Membership } from "@prisma/client";

export async function insertMembership({ ...membership }: Membership) {
	await db.membership.create({
		data: membership,
	});
}

export async function getAllMemberships() {
	return db.membership.findMany();
}
