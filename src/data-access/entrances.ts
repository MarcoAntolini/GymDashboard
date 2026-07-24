"use server";

import { assertMutationPayload } from "@/lib/domain/mutation-allowlist";
import { db } from "@/lib/db";
import {
	selectJustifyingPurchaseId,
	type JustifyingPurchaseCandidate,
} from "@/lib/entrance-justification";
import {
	buildListResult,
	normalizeListQuery,
	toPrismaPage,
	type ListFilters,
	type ListQueryInput,
	type ListResult,
	type ListSort,
} from "@/lib/list";
import {
	ENTRANCE_DEFAULT_SORT,
	ENTRANCE_FILTER_ALLOWLIST,
	ENTRANCE_SORT_ALLOWLIST,
} from "@/lib/list/entrances";
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

function buildEntranceWhere(filters: ListFilters): Prisma.EntranceWhereInput {
	const where: Prisma.EntranceWhereInput = {};
	const and: Prisma.EntranceWhereInput[] = [];

	const purchaseIdRaw = filters.purchaseId;
	if (typeof purchaseIdRaw === "number" && Number.isFinite(purchaseIdRaw)) {
		where.purchaseId = Math.trunc(purchaseIdRaw);
	} else if (typeof purchaseIdRaw === "string") {
		const n = Number.parseInt(purchaseIdRaw.trim(), 10);
		if (Number.isFinite(n)) where.purchaseId = n;
	}

	const client = filters.client;
	if (typeof client === "string") {
		const value = client.trim();
		if (value) {
			and.push({
				purchase: {
					client: {
						OR: [
							{ surname: { contains: value } },
							{ name: { contains: value } },
						],
					},
				},
			});
		}
	}

	const product = filters.product;
	if (typeof product === "string") {
		const value = product.trim();
		if (value) {
			and.push({
				purchase: { productCode: { contains: value } },
			});
		}
	}

	if (and.length) where.AND = and;
	return where;
}

function buildEntranceOrderBy(
	sort: ListSort[]
): Prisma.EntranceOrderByWithRelationInput[] {
	const orderBy: Prisma.EntranceOrderByWithRelationInput[] = [];
	for (const entry of sort) {
		const dir = entry.desc ? ("desc" as const) : ("asc" as const);
		switch (entry.id) {
			case "id":
				orderBy.push({ id: dir });
				break;
			case "date":
				orderBy.push({ date: dir });
				break;
			case "purchaseId":
				orderBy.push({ purchaseId: dir });
				break;
			case "client":
				orderBy.push({ purchase: { client: { surname: dir } } });
				orderBy.push({ purchase: { client: { name: dir } } });
				break;
			case "product":
				orderBy.push({ purchase: { productCode: dir } });
				break;
			default:
				break;
		}
	}
	// Tie-break stabile su id (evita overlap OFFSET con sort non unico).
	if (!orderBy.some((o) => "id" in o)) {
		orderBy.push({ id: "asc" });
	}
	return orderBy;
}

/**
 * Lista Ingressi server-side: filtri su Conferma, sort + paginazione via DB.
 */
export async function listEntrances(
	input: ListQueryInput = {}
): Promise<ListResult<EntranceRow>> {
	const query = normalizeListQuery(input, {
		sortAllowlist: ENTRANCE_SORT_ALLOWLIST,
		filterAllowlist: ENTRANCE_FILTER_ALLOWLIST,
		defaultSort: [...ENTRANCE_DEFAULT_SORT],
	});
	const where = buildEntranceWhere(query.filters);
	const { skip, take } = toPrismaPage(query);
	const orderBy = buildEntranceOrderBy(query.sort);
	const [total, items] = await Promise.all([
		db.entrance.count({ where }),
		db.entrance.findMany({
			where,
			skip,
			take,
			orderBy,
			include: entranceInclude,
		}),
	]);
	return buildListResult(items, total, query);
}

/**
 * Registra un Ingresso per il Cliente: in una sola transazione sceglie l'Acquisto
 * giustificatore (tie-break dominio) e inserisce con purchaseId.
 */
export async function registerEntrance(clientId: number, date?: Date) {
	assertMutationPayload(
		"entrance",
		"create",
		date === undefined ? { clientId } : { clientId, date }
	);
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

export async function editEntrance(input: { id: number; date: Date }) {
	assertMutationPayload("entrance", "update", input);
	const { id, date } = input;
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
