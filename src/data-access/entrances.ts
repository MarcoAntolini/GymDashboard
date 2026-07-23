"use server";

import {
	NO_JUSTIFYING_PURCHASE_ERROR,
	selectJustifyingPurchaseId,
	type PurchaseCandidate,
} from "@/lib/domain/entrance-justification";
import { assertAllowedMutation } from "@/lib/domain/mutation-fields";
import { db } from "@/lib/db";
import { Entrance, Prisma } from "@prisma/client";

/**
 * Ingresso list/detail DTO — column classes (see VIEW_COLUMN_MATRIX.ingressi):
 * - nativa: id, date, purchaseId
 * - join: purchase.client (Cliente label), purchase.productCode
 * - derivata: productKind from live purchase.prodotto ISA (badge only;
 *   justification uses Acquisto snapshots, not this live kind)
 */
export type EntranceRow = Entrance & {
	/** join graph — Cliente via Acquisto; Ingresso has no clientId column */
	purchase: {
		id: number;
		clientId: number;
		date: Date;
		productCode: string;
		client: { id: number; name: string; surname: string };
		prodotto: {
			code: string;
			membership: { duration: number } | null;
			entranceSet: { entranceNumber: number } | null;
		};
	};
};

const entranceInclude = {
	purchase: {
		include: {
			client: true,
			prodotto: { include: { membership: true, entranceSet: true } },
		},
	},
} satisfies Prisma.EntranceInclude;

type RegisterEntranceInput = {
	clientId: number;
	date?: Date;
};

/**
 * Register Ingresso for a Cliente: pick justifying Acquisto in one $transaction
 * (RepeatableRead + FOR UPDATE on the client's purchases), then insert by purchaseId only.
 */
export async function registerEntrance(
	input: RegisterEntranceInput
): Promise<EntranceRow> {
	assertAllowedMutation("ingressi", "create", input);
	const { clientId, date } = input;
	const at = date ?? new Date();

	return await db.$transaction(
		async (tx) => {
			await tx.$queryRaw`
				SELECT \`id\` FROM \`acquisti\` WHERE \`id_cliente\` = ${clientId} FOR UPDATE
			`;

			const purchases = await tx.purchase.findMany({
				where: { clientId },
				include: { _count: { select: { entrances: true } } },
			});

			const candidates: PurchaseCandidate[] = purchases.map((p) => ({
				id: p.id,
				date: p.date,
				duration: p.duration,
				entranceNumber: p.entranceNumber,
				usedEntranceCount: p._count.entrances,
			}));

			const purchaseId = selectJustifyingPurchaseId(candidates, at);
			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.create({
				data: {
					date: at,
					purchaseId,
				},
				include: entranceInclude,
			});
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
	);
}

/** Alias used by the Ingressi form — same domain registration path. */
export async function createEntrance(input: RegisterEntranceInput) {
	return registerEntrance(input);
}

export async function getAllEntrances(): Promise<EntranceRow[]> {
	return await db.entrance.findMany({
		include: entranceInclude,
		orderBy: [{ date: "desc" }, { id: "desc" }],
	});
}

export async function getEntrance(id: number): Promise<EntranceRow | null> {
	return await db.entrance.findUnique({
		where: { id },
		include: entranceInclude,
	});
}

type EditEntranceInput = {
	id: number;
	date: Date;
	/** Optional: re-justify for another Cliente; defaults to current purchase's client. */
	clientId?: number;
};

/**
 * Update Ingresso by id. Recomputes justifying Acquisto for the (client, date)
 * with the same transaction + tie-break rules as registration.
 */
export async function editEntrance(input: EditEntranceInput): Promise<EntranceRow> {
	assertAllowedMutation("ingressi", "update", input);
	const { id, date, clientId } = input;
	return await db.$transaction(
		async (tx) => {
			const existing = await tx.entrance.findUnique({
				where: { id },
				include: { purchase: true },
			});
			if (!existing) {
				throw new Error(`Ingresso non trovato: ${id}`);
			}

			const resolvedClientId = clientId ?? existing.purchase.clientId;

			await tx.$queryRaw`
				SELECT \`id\` FROM \`acquisti\` WHERE \`id_cliente\` = ${resolvedClientId} FOR UPDATE
			`;

			const purchases = await tx.purchase.findMany({
				where: { clientId: resolvedClientId },
				include: {
					entrances: {
						where: { id: { not: id } },
						select: { id: true },
					},
				},
			});

			const candidates: PurchaseCandidate[] = purchases.map((p) => ({
				id: p.id,
				date: p.date,
				duration: p.duration,
				entranceNumber: p.entranceNumber,
				usedEntranceCount: p.entrances.length,
			}));

			const purchaseId = selectJustifyingPurchaseId(candidates, date);
			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.update({
				where: { id },
				data: {
					date,
					purchaseId,
				},
				include: entranceInclude,
			});
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
	);
}

export async function deleteEntrance({ id }: { id: number }) {
	return await db.entrance.delete({
		where: { id },
	});
}

type DailyEntrances = {
	hourOfDay: string;
	totalEntrances: number;
};
type WeeklyEntrances = {
	dayOfWeek: string;
	totalEntrances: number;
};
type MonthlyEntrances = {
	month: string;
	totalEntrances: number;
};

export async function getDailyEntrances(startDate: Date, endDate: Date): Promise<DailyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true,
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
	});
	const totalEntrances = new Array(24).fill(0);
	for (const entrance of entrances) {
		const hour = entrance.date.getHours();
		totalEntrances[hour] += entrance._count.date;
	}
	return Array.from({ length: 24 }, (_, hour) => ({
		hourOfDay: `${hour.toString().padStart(2, "0")}:00`,
		totalEntrances: totalEntrances[hour],
	}));
}

export async function getWeeklyEntrances(startDate: Date, endDate: Date): Promise<WeeklyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true,
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
	});
	const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	const weekdayCounts = new Array(7).fill(0);
	for (const entrance of entrances) {
		const day = entrance.date.getDay();
		weekdayCounts[day] += entrance._count.date;
	}
	return weekdays.map((day, index) => ({
		dayOfWeek: day,
		totalEntrances: weekdayCounts[index],
	}));
}

export async function getMonthlyEntrances(
	startDate: Date,
	endDate: Date
): Promise<MonthlyEntrances[]> {
	const entrances = await db.entrance.groupBy({
		by: ["date"],
		_count: {
			date: true,
		},
		where: {
			date: {
				gte: startDate,
				lte: endDate,
			},
		},
	});
	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const monthCounts = new Array(12).fill(0);
	for (const entrance of entrances) {
		const month = entrance.date.getMonth();
		monthCounts[month] += entrance._count.date;
	}
	return months.map((month, index) => ({
		month: month,
		totalEntrances: monthCounts[index],
	}));
}
