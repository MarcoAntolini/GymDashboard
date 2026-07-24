"use server";

import { db } from "@/lib/db";
import {
	selectJustifyingPurchaseId,
	type JustifyingPurchaseCandidate,
} from "@/lib/entrance-justification";
import { Prisma } from "@prisma/client";

const entranceInclude = {
	purchase: {
		include: {
			client: true,
			prodotto: {
				include: { membership: true, entranceSet: true },
			},
		},
	},
} as const;

export type EntranceRow = Prisma.EntranceGetPayload<{ include: typeof entranceInclude }>;

/**
 * Registra un Ingresso per il Cliente: in una sola transazione sceglie l'Acquisto
 * giustificatore (tie-break dominio) e inserisce con purchaseId.
 */
export async function registerEntrance(clientId: number, date?: Date) {
	const at = date ?? new Date();

	return await db.$transaction(
		async (tx) => {
			// Lock sulle righe Acquisto del Cliente (mitiga race sul residuo pacchetto).
			await tx.$queryRaw`
				SELECT id FROM acquisti WHERE id_cliente = ${clientId} FOR UPDATE
			`;

			const purchases = await tx.purchase.findMany({
				where: { clientId },
				include: {
					_count: { select: { entrance: true } },
				},
			});

			const candidates: JustifyingPurchaseCandidate[] = purchases.map((p) => ({
				id: p.id,
				date: p.date,
				duration: p.duration,
				entranceNumber: p.entranceNumber,
				entrancesLinked: p._count.entrance,
			}));

			const purchaseId = selectJustifyingPurchaseId(candidates, at);

			return await tx.entrance.create({
				data: {
					purchaseId,
					date: at,
				},
				include: entranceInclude,
			});
		},
		{ isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead }
	);
}

/** @deprecated Usa registerEntrance — creato solo per compatibilità di naming. */
export async function createEntrance({
	clientId,
	date,
}: {
	clientId: number;
	date?: Date;
}) {
	return registerEntrance(clientId, date);
}

export async function getAllEntrances(): Promise<EntranceRow[]> {
	return await db.entrance.findMany({
		include: entranceInclude,
		orderBy: { date: "desc" },
	});
}

export async function getEntrance(id: number) {
	return await db.entrance.findUnique({
		where: { id },
		include: entranceInclude,
	});
}

export async function editEntrance({ id, date }: { id: number; date: Date }) {
	return await db.entrance.update({
		where: { id },
		data: { date },
		include: entranceInclude,
	});
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
