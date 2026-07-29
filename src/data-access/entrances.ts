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
import {
	aggregateBanconeDaily,
	computeEntranceFrequency,
	type BanconeDailyPoint,
	type EntranceFrequency,
	type FrequencyPoint,
} from "@/lib/frequency-aggregation";
import {
	aggregateByPeriod,
	normalizeInclusiveRange,
	type PeriodType,
} from "@/lib/period-aggregation";
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

function parsePositiveIntFilter(raw: ListFilters[string]): number | undefined {
	if (typeof raw === "number" && Number.isFinite(raw)) {
		const n = Math.trunc(raw);
		return n > 0 ? n : undefined;
	}
	if (typeof raw === "string") {
		const trimmed = raw.trim();
		// Solo intero completo (niente prefissi parziali tipo "7" â†’ 7).
		if (!/^\d+$/.test(trimmed)) return undefined;
		const n = Number.parseInt(trimmed, 10);
		return Number.isFinite(n) && n > 0 ? n : undefined;
	}
	return undefined;
}

function buildEntranceWhere(filters: ListFilters): Prisma.EntranceWhereInput {
	const where: Prisma.EntranceWhereInput = {};
	const and: Prisma.EntranceWhereInput[] = [];

	const id = parsePositiveIntFilter(filters.id);
	if (id !== undefined) where.id = id;

	const purchaseId = parsePositiveIntFilter(filters.purchaseId);
	if (purchaseId !== undefined) where.purchaseId = purchaseId;

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

/** @deprecated Usa registerEntrance â€” creato solo per compatibilitÃ  di naming. */
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

export type EntrancePeriodPoint = {
	key: string;
	label: string;
	totalEntrances: number;
};

/**
 * Serie temporale Ingressi sulla granularitÃ  di periodo scelta
 * (giornaliero / settimanale / mensile / annuale) â€” non distribuzione ora/weekday.
 */
export async function getEntrancesByPeriod(
	startDate: Date,
	endDate: Date,
	periodType: PeriodType
): Promise<EntrancePeriodPoint[]> {
	const { from, to } = normalizeInclusiveRange(startDate, endDate);
	const rows = await db.entrance.findMany({
		where: {
			date: {
				gte: from,
				lte: to,
			},
		},
		select: { date: true },
	});
	return aggregateByPeriod(rows, (row) => row.date, from, to, periodType).map((point) => ({
		key: point.key,
		label: point.label,
		totalEntrances: point.value,
	}));
}

/** @deprecated Preferisci getEntrancesByPeriod(..., "daily"). */
export async function getDailyEntrances(startDate: Date, endDate: Date) {
	return getEntrancesByPeriod(startDate, endDate, "daily");
}

/** @deprecated Preferisci getEntrancesByPeriod(..., "weekly"). */
export async function getWeeklyEntrances(startDate: Date, endDate: Date) {
	return getEntrancesByPeriod(startDate, endDate, "weekly");
}

/** @deprecated Preferisci getEntrancesByPeriod(..., "monthly"). */
export async function getMonthlyEntrances(startDate: Date, endDate: Date) {
	return getEntrancesByPeriod(startDate, endDate, "monthly");
}

export type { BanconeDailyPoint, EntranceFrequency, FrequencyPoint };

export type EntranceFrequencyBundle = EntranceFrequency & {
	banconeDaily: BanconeDailyPoint[];
};

/**
 * Frequenza Ingressi (ora / weekday / mese) + volume Ingressi/Acquisti per giorno.
 * Dimensioni separate dalla serie PeriodType di getEntrancesByPeriod.
 */
export async function getEntranceFrequencyAndBancone(
	startDate: Date,
	endDate: Date
): Promise<EntranceFrequencyBundle> {
	const { from, to } = normalizeInclusiveRange(startDate, endDate);
	const dateFilter = { gte: from, lte: to };
	const [entrances, purchases] = await Promise.all([
		db.entrance.findMany({
			where: { date: dateFilter },
			select: { date: true },
		}),
		db.purchase.findMany({
			where: { date: dateFilter },
			select: { date: true },
		}),
	]);
	const entranceDates = entrances.map((row) => row.date);
	const purchaseDates = purchases.map((row) => row.date);
	const frequency = computeEntranceFrequency(entranceDates);
	return {
		...frequency,
		banconeDaily: aggregateBanconeDaily(entranceDates, purchaseDates, from, to),
	};
}
