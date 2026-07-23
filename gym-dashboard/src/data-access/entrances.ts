"use server";

import { requireRole } from "@/lib/auth";
import {
	addDays,
	eachDayOfInterval,
	eachMonthOfInterval,
	eachWeekOfInterval,
	eachYearOfInterval,
	endOfDay,
	endOfWeek,
	format,
	startOfDay,
	startOfWeek
} from "date-fns";
import { it } from "date-fns/locale";
import {
	packageResidual,
	selectJustifyingPurchaseId,
	type PurchaseForJustification
} from "@/lib/entrance-justification";
import { db } from "@/lib/db";
import {
	buildWhere,
	enumValues,
	parseListQuery,
	resolveOrderBy,
	textContains,
	type ColumnFilter,
	type FacetOption,
	type ListQuery,
	type ListResult
} from "@/lib/list-query";
import { Entrance, Prisma } from "@prisma/client";

const NO_JUSTIFYING_PURCHASE_ERROR =
	"Nessun Acquisto giustifica questo Ingresso: nessun Abbonamento valido in data e nessun Pacchetto con residuo > 0.";

const entranceInclude = {
	purchase: {
		include: {
			client: true,
			prodotto: {
				include: {
					membership: true,
					entranceSet: true
				}
			}
		}
	}
} as const;

type EntranceWithPurchaseRaw = Prisma.EntranceGetPayload<{ include: typeof entranceInclude }>;

export type EntranceWithPurchase = Omit<EntranceWithPurchaseRaw, "purchase"> & {
	purchase: Omit<EntranceWithPurchaseRaw["purchase"], "amount"> & { amount: number };
};

export type EntranceJustificationKind = "Abbonamento" | "Pacchetto";

export type EntranceJustificationPreview = {
	purchaseId: number | null;
	kind: EntranceJustificationKind | null;
	productCode: string | null;
	/** Residuo pacchetto dopo questo Ingresso (solo Pacchetto). */
	residualAfter: number | null;
	/** Fine validità esclusiva dell'Abbonamento (solo Abbonamento). */
	membershipEndsExclusive: Date | null;
	message: string;
};

function serializeEntrance(entrance: EntranceWithPurchaseRaw): EntranceWithPurchase {
	return {
		...entrance,
		purchase: {
			...entrance.purchase,
			amount: Number(entrance.purchase.amount)
		}
	};
}

type PurchaseForSelection = {
	id: number;
	date: Date;
	productCode: string;
	membershipDuration: number | null;
	entranceNumber: number | null;
	usedEntrances: number;
};

async function loadPurchasesForJustification(
	tx: Prisma.TransactionClient | typeof db,
	clientId: number,
	excludeEntranceId?: number
): Promise<PurchaseForSelection[]> {
	const purchases = await tx.purchase.findMany({
		where: { clientId },
		include: {
			entrances: {
				where: excludeEntranceId != null ? { id: { not: excludeEntranceId } } : undefined,
				select: { id: true }
			}
		}
	});

	// Usa gli snapshot sull'Acquisto (durata / N), non i valori live del Prodotto.
	return purchases.map((p) => ({
		id: p.id,
		date: p.date,
		productCode: p.productCode,
		membershipDuration: p.membershipDuration,
		entranceNumber: p.entranceNumber,
		usedEntrances: p.entrances.length
	}));
}

function toJustificationInput(purchases: PurchaseForSelection[]): PurchaseForJustification[] {
	return purchases.map((p) => ({
		id: p.id,
		date: p.date,
		membershipDuration: p.membershipDuration,
		entranceNumber: p.entranceNumber,
		usedEntrances: p.usedEntrances
	}));
}

function buildJustificationPreview(
	purchases: PurchaseForSelection[],
	at: Date
): EntranceJustificationPreview {
	const purchaseId = selectJustifyingPurchaseId(toJustificationInput(purchases), at);
	if (purchaseId == null) {
		return {
			purchaseId: null,
			kind: null,
			productCode: null,
			residualAfter: null,
			membershipEndsExclusive: null,
			message: NO_JUSTIFYING_PURCHASE_ERROR
		};
	}

	const purchase = purchases.find((p) => p.id === purchaseId);
	if (!purchase) {
		return {
			purchaseId: null,
			kind: null,
			productCode: null,
			residualAfter: null,
			membershipEndsExclusive: null,
			message: NO_JUSTIFYING_PURCHASE_ERROR
		};
	}

	if (purchase.membershipDuration != null) {
		const membershipEndsExclusive = addDays(purchase.date, purchase.membershipDuration);
		return {
			purchaseId: purchase.id,
			kind: "Abbonamento",
			productCode: purchase.productCode,
			residualAfter: null,
			membershipEndsExclusive,
			message: `Giustificato da Acquisto #${purchase.id} (Abbonamento ${purchase.productCode}, priorità su Pacchetto).`
		};
	}

	const entranceNumber = purchase.entranceNumber ?? 0;
	const residualAfter = packageResidual(entranceNumber, purchase.usedEntrances + 1);
	return {
		purchaseId: purchase.id,
		kind: "Pacchetto",
		productCode: purchase.productCode,
		residualAfter,
		membershipEndsExclusive: null,
		message: `Giustificato da Acquisto #${purchase.id} (Pacchetto ${purchase.productCode}: residuo dopo Ingresso ${residualAfter}).`
	};
}

async function createJustifiedEntrance(
	clientId: number,
	entranceDate: Date
): Promise<EntranceWithPurchase> {
	const entrance = await db.$transaction(
		async (tx) => {
			await tx.$queryRaw`
				SELECT id FROM acquisti WHERE id_cliente = ${clientId} FOR UPDATE
			`;

			const purchases = await loadPurchasesForJustification(tx, clientId);
			const purchaseId = selectJustifyingPurchaseId(toJustificationInput(purchases), entranceDate);

			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.create({
				data: {
					purchaseId,
					date: entranceDate
				},
				include: entranceInclude
			});
		},
		{
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
		}
	);

	return serializeEntrance(entrance);
}

/** Anteprima non mutante della regola di giustificazione (Abbonamento → Pacchetto FIFO). */
export async function previewEntranceJustification(
	clientId: number,
	date?: Date
): Promise<EntranceJustificationPreview> {
	await requireRole("Employee");
	if (!Number.isInteger(clientId) || clientId <= 0) {
		return {
			purchaseId: null,
			kind: null,
			productCode: null,
			residualAfter: null,
			membershipEndsExclusive: null,
			message: "Seleziona un Cliente per vedere quale Acquisto giustificherà l'Ingresso."
		};
	}

	const entranceDate = date ?? new Date();
	const purchases = await loadPurchasesForJustification(db, clientId);
	return buildJustificationPreview(purchases, entranceDate);
}

export async function registerEntrance(
	clientId: number,
	date?: Date
): Promise<EntranceWithPurchase> {
	await requireRole("Employee");
	const entranceDate = date ?? new Date();
	return createJustifiedEntrance(clientId, entranceDate);
}

export async function createEntrance({
	clientId,
	date
}: {
	clientId: number;
	date?: Date;
}) {
	await requireRole("Employee");
	return registerEntrance(clientId, date);
}

/**
 * `client` search = OR on Cliente name/surname via purchase.client.
 * Documented mapping: UI column `client` → Prisma `purchase.client` relation filters.
 */
function entranceClientWhere(value: string): Prisma.EntranceWhereInput {
	const or: Prisma.EntranceWhereInput[] = [
		{ purchase: { is: { client: { is: { surname: { contains: value } } } } } },
		{ purchase: { is: { client: { is: { name: { contains: value } } } } } }
	];
	const asId = Number(value.replace(/^#/, "").trim());
	if (Number.isInteger(asId) && asId > 0) {
		or.push({ purchase: { is: { clientId: asId } } });
	}
	return { OR: or };
}

/**
 * `product` text = contains on purchase.productCode;
 * `product` faceted = in on purchase.productCode.
 * Kind/residual display uses Purchase snapshots (membershipDuration / entranceNumber).
 */
function entranceProductWhere(filter: ColumnFilter): Prisma.EntranceWhereInput | undefined {
	if (filter.kind === "text") {
		const value = textContains(filter);
		return value
			? { purchase: { is: { productCode: { contains: value } } } }
			: undefined;
	}
	const values = enumValues(filter);
	return values
		? { purchase: { is: { productCode: { in: values } } } }
		: undefined;
}

const entranceFilterMap: Partial<
	Record<string, (filter: ColumnFilter) => Prisma.EntranceWhereInput | undefined>
> = {
	client: (filter) => {
		const value = textContains(filter);
		return value ? entranceClientWhere(value) : undefined;
	},
	product: entranceProductWhere
};

const entranceSortMap: Partial<
	Record<string, (desc: boolean) => Prisma.EntranceOrderByWithRelationInput>
> = {
	date: (desc) => ({ date: desc ? "desc" : "asc" }),
	id: (desc) => ({ id: desc ? "desc" : "asc" }),
	client: (desc) => ({
		purchase: { client: { surname: desc ? "desc" : "asc" } }
	}),
	product: (desc) => ({
		purchase: { productCode: desc ? "desc" : "asc" }
	}),
	purchase: (desc) => ({ purchaseId: desc ? "desc" : "asc" })
};

async function loadEntranceFacets(
	filters: ListQuery["filters"]
): Promise<Record<string, FacetOption[]>> {
	const whereWithoutProduct = buildWhere(filters, entranceFilterMap, {
		exclude: "product"
	});

	// Prisma cannot groupBy relation fields — aggregate productCode in memory for facets.
	// Volumes are gym-scale; list itself remains paginated via skip/take.
	const rows = await db.entrance.findMany({
		where: whereWithoutProduct,
		select: { purchase: { select: { productCode: true } } }
	});

	const counts = new Map<string, number>();
	for (const row of rows) {
		const code = row.purchase.productCode;
		counts.set(code, (counts.get(code) ?? 0) + 1);
	}

	return {
		product: Array.from(counts.entries())
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([value, count]) => ({ value, count }))
	};
}

/** Server-paginated/filtered entrance list (client/product join via purchase + snapshots). */
export async function listEntrances(
	rawQuery: ListQuery
): Promise<ListResult<EntranceWithPurchase>> {
	await requireRole("Employee");
	const query = parseListQuery(rawQuery);
	const where = buildWhere(query.filters, entranceFilterMap);
	const orderBy = resolveOrderBy(query.sort, entranceSortMap, { date: "desc" });

	const [total, items, facets] = await Promise.all([
		db.entrance.count({ where }),
		db.entrance.findMany({
			where,
			skip: query.page * query.pageSize,
			take: query.pageSize,
			orderBy,
			include: entranceInclude
		}),
		loadEntranceFacets(query.filters)
	]);

	return {
		items: items.map(serializeEntrance),
		total,
		facets
	};
}

export async function getEntrance(id: number): Promise<EntranceWithPurchase | null> {
	await requireRole("Employee");
	const entrance = await db.entrance.findUnique({
		where: { id },
		include: entranceInclude
	});
	return entrance ? serializeEntrance(entrance) : null;
}

export async function editEntrance({
	id,
	date
}: Pick<Entrance, "id" | "date">): Promise<EntranceWithPurchase> {
	await requireRole("Employee");

	const entrance = await db.$transaction(
		async (tx) => {
			const existing = await tx.entrance.findUnique({
				where: { id },
				include: { purchase: true }
			});
			if (!existing) {
				throw new Error("Ingresso non trovato.");
			}

			const clientId = existing.purchase.clientId;

			await tx.$queryRaw`
				SELECT id FROM acquisti WHERE id_cliente = ${clientId} FOR UPDATE
			`;

			const purchases = await loadPurchasesForJustification(tx, clientId, id);
			const purchaseId = selectJustifyingPurchaseId(toJustificationInput(purchases), date);

			if (purchaseId == null) {
				throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
			}

			return await tx.entrance.update({
				where: { id },
				data: { date, purchaseId },
				include: entranceInclude
			});
		},
		{
			isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead
		}
	);

	return serializeEntrance(entrance);
}

export async function deleteEntrance({ id }: Pick<Entrance, "id">) {
	await requireRole("Employee");
	return await db.entrance.delete({
		where: { id }
	});
}

/** Granularità temporale per l'analisi Ingressi sul periodo scelto. */
export type EntranceAggregationGranularity = "daily" | "weekly" | "monthly" | "yearly";

/** Punto serie temporale: etichetta periodo in italiano + conteggio Ingressi. */
export type AggregatedEntrances = {
	period: string;
	totalEntrances: number;
};

const WEEK_STARTS_ON = 1 as const; // lunedì

function capitalizeIt(value: string): string {
	if (!value) return value;
	return value.charAt(0).toLocaleUpperCase("it-IT") + value.slice(1);
}

function normalizeRange(startDate: Date, endDate: Date): { from: Date; to: Date } {
	const from = startOfDay(startDate);
	const to = endOfDay(endDate);
	if (from.getTime() > to.getTime()) {
		return { from: startOfDay(endDate), to: endOfDay(startDate) };
	}
	return { from, to };
}

type PeriodBucket = {
	key: string;
	period: string;
};

function buildPeriodBuckets(
	from: Date,
	to: Date,
	granularity: EntranceAggregationGranularity
): PeriodBucket[] {
	switch (granularity) {
		case "daily":
			return eachDayOfInterval({ start: from, end: to }).map((day) => ({
				key: format(day, "yyyy-MM-dd"),
				period: format(day, "dd/MM/yyyy")
			}));
		case "weekly":
			return eachWeekOfInterval({ start: from, end: to }, { weekStartsOn: WEEK_STARTS_ON }).map(
				(weekStart) => {
					const weekEnd = endOfWeek(weekStart, { weekStartsOn: WEEK_STARTS_ON });
					const clippedStart = weekStart < from ? from : weekStart;
					const clippedEnd = weekEnd > to ? to : weekEnd;
					return {
						key: format(weekStart, "RRRR-'W'II"),
						period: `${format(clippedStart, "dd/MM")} – ${format(clippedEnd, "dd/MM/yyyy")}`
					};
				}
			);
		case "monthly":
			return eachMonthOfInterval({ start: from, end: to }).map((monthStart) => ({
				key: format(monthStart, "yyyy-MM"),
				period: capitalizeIt(format(monthStart, "LLLL yyyy", { locale: it }))
			}));
		case "yearly":
			return eachYearOfInterval({ start: from, end: to }).map((yearStart) => ({
				key: format(yearStart, "yyyy"),
				period: format(yearStart, "yyyy")
			}));
	}
}

function bucketKeyForDate(date: Date, granularity: EntranceAggregationGranularity): string {
	switch (granularity) {
		case "daily":
			return format(date, "yyyy-MM-dd");
		case "weekly":
			return format(startOfWeek(date, { weekStartsOn: WEEK_STARTS_ON }), "RRRR-'W'II");
		case "monthly":
			return format(date, "yyyy-MM");
		case "yearly":
			return format(date, "yyyy");
	}
}

/**
 * Aggrega gli Ingressi nel periodo per la granularità scelta.
 * L'asse temporale è una serie (giorno / settimana / mese / anno), non una distribuzione
 * su ora-del-giorno o giorno-della-settimana.
 */
export async function getEntrancesAggregated(
	startDate: Date,
	endDate: Date,
	granularity: EntranceAggregationGranularity
): Promise<AggregatedEntrances[]> {
	await requireRole("Employee");
	const { from, to } = normalizeRange(startDate, endDate);
	const buckets = buildPeriodBuckets(from, to, granularity);
	if (buckets.length === 0) return [];

	const entrances = await db.entrance.findMany({
		where: {
			date: {
				gte: from,
				lte: to
			}
		},
		select: { date: true }
	});

	const counts = new Map<string, number>();
	for (const bucket of buckets) {
		counts.set(bucket.key, 0);
	}
	for (const entrance of entrances) {
		const key = bucketKeyForDate(entrance.date, granularity);
		if (counts.has(key)) {
			counts.set(key, (counts.get(key) ?? 0) + 1);
		}
	}

	return buckets.map((bucket) => ({
		period: bucket.period,
		totalEntrances: counts.get(bucket.key) ?? 0
	}));
}

export async function getDailyEntrances(
	startDate: Date,
	endDate: Date
): Promise<AggregatedEntrances[]> {
	return getEntrancesAggregated(startDate, endDate, "daily");
}

export async function getWeeklyEntrances(
	startDate: Date,
	endDate: Date
): Promise<AggregatedEntrances[]> {
	return getEntrancesAggregated(startDate, endDate, "weekly");
}

export async function getMonthlyEntrances(
	startDate: Date,
	endDate: Date
): Promise<AggregatedEntrances[]> {
	return getEntrancesAggregated(startDate, endDate, "monthly");
}

export async function getYearlyEntrances(
	startDate: Date,
	endDate: Date
): Promise<AggregatedEntrances[]> {
	return getEntrancesAggregated(startDate, endDate, "yearly");
}
