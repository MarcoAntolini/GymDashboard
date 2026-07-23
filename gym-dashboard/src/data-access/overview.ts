"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { paymentTypeLabel, personLabel } from "@/lib/format";
import {
	buildDeskDays,
	fillHourBuckets,
	fillMonthBuckets,
	fillWeekdayBuckets,
	peakBucket,
	peakDeskDay,
	type DeskDay,
	type FreqBucket
} from "@/lib/overview-frequency";
import {
	AT_RISK_DAY_OPTIONS,
	countRenewalsInPeriod,
	DEFAULT_AT_RISK_DAYS,
	isPurchaseRelevantAt,
	listAtRiskClients,
	type AtRiskDays,
	type ClientActivityInput,
	type TitleKind
} from "@/lib/retention-proxies";
import { PaymentType, Prisma, PurchaseType } from "@prisma/client";
import { eachDayOfInterval, endOfDay, format, startOfDay, startOfMonth, subDays } from "date-fns";

export type OverviewPeriod = "current_month" | "last_30_days";

export type OverviewBreakdownRow = {
	key: string;
	label: string;
	count: number;
	amount: number;
};

export type OverviewProductRankRow = {
	productCode: string;
	kind: PurchaseType | null;
	kindLabel: string;
	count: number;
	amount: number;
};

export type OverviewFreqBucket = FreqBucket;
export type OverviewDeskDay = DeskDay;

export type OverviewAtRiskRow = {
	clientId: number;
	clientLabel: string;
	daysSinceLastEntrance: number | null;
	titleKind: TitleKind;
};

export type OverviewRetention = {
	/** Clienti distinti con ≥1 Ingresso nel periodo. */
	activeClients: number;
	/** Acquisti nel periodo che sono riacquisto/rinnovo (cliente già acquirente). */
	renewalsCount: number;
	/** Clienti distinti con almeno un riacquisto/rinnovo nel periodo. */
	renewingClientsCount: number;
	/** Soglia N usata per “a rischio”. */
	atRiskDays: AtRiskDays;
	/** Clienti con titolo ancora rilevante (snapshot) e senza Ingresso da ≥ N giorni. */
	atRiskCount: number;
	/** Campione ordinato (mai entrati / più giorni senza Ingresso). */
	atRiskSample: OverviewAtRiskRow[];
};

export type OverviewStats = {
	period: OverviewPeriod;
	from: string;
	to: string;
	purchases: {
		totalAmount: number;
		count: number;
		byKind: OverviewBreakdownRow[];
	};
	payments: {
		totalAmount: number;
		count: number;
		byType: OverviewBreakdownRow[];
	};
	/** Ranking prodotti venduti nel periodo (ricavo e quantità), DB-side. */
	productRanking: {
		byRevenue: OverviewProductRankRow[];
		byQuantity: OverviewProductRankRow[];
	};
	entrances: {
		count: number;
	};
	/**
	 * Distribuzione Ingressi su dimensioni di calendario (non serie temporale).
	 * Ora / weekday / mese: asse fisso con zeri; picchi = bucket con conteggio massimo.
	 */
	frequency: {
		byHour: OverviewFreqBucket[];
		byWeekday: OverviewFreqBucket[];
		byMonth: OverviewFreqBucket[];
		peaks: {
			hour: OverviewFreqBucket | null;
			weekday: OverviewFreqBucket | null;
			month: OverviewFreqBucket | null;
		};
	};
	/** Carico bancone: Ingressi + Acquisti per giorno nel periodo. */
	deskLoad: {
		byDay: OverviewDeskDay[];
		peakDay: OverviewDeskDay | null;
	};
	/** Entrate − Uscite nel periodo (Acquisti − Pagamenti). */
	balance: number;
	retention: OverviewRetention;
};

type RawBucketRow = { bucket: number | bigint; count: number | bigint };
type RawDayCountRow = { day: Date | string; count: number | bigint };

function toInt(value: number | bigint): number {
	return typeof value === "bigint" ? Number(value) : Number(value);
}

function normalizeBucketRows(rows: RawBucketRow[]): Array<{ bucket: number; count: number }> {
	return rows.map((row) => ({
		bucket: toInt(row.bucket),
		count: toInt(row.count)
	}));
}

function dayKeyFromSql(day: Date | string): string {
	if (typeof day === "string") {
		// MySQL DATE may come as "YYYY-MM-DD" or datetime string
		return day.slice(0, 10);
	}
	return format(day, "yyyy-MM-dd");
}

const PAYMENT_TYPES: PaymentType[] = [
	PaymentType.Salary,
	PaymentType.Bill,
	PaymentType.Equipment,
	PaymentType.Intervention
];

const PRODUCT_RANK_LIMIT = 10;
const AT_RISK_SAMPLE_LIMIT = 15;

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
	if (value == null) return 0;
	return Number(value);
}

function resolvePeriodBounds(period: OverviewPeriod, now = new Date()): { from: Date; to: Date } {
	const to = endOfDay(now);
	if (period === "current_month") {
		return { from: startOfMonth(now), to };
	}
	return { from: startOfDay(subDays(now, 29)), to };
}

function normalizeAtRiskDays(value: number | undefined): AtRiskDays {
	if (value != null && (AT_RISK_DAY_OPTIONS as readonly number[]).includes(value)) {
		return value as AtRiskDays;
	}
	return DEFAULT_AT_RISK_DAYS;
}

function kindLabel(kind: PurchaseType | null): string {
	if (kind === PurchaseType.Membership) return "Abbonamento";
	if (kind === PurchaseType.EntranceSet) return "Pacchetto ingressi";
	return "—";
}

function buildProductRanking(
	groups: { productCode: string; _sum: { amount: Prisma.Decimal | null }; _count: { _all: number } }[],
	productsByCode: Map<
		string,
		{ membership: { productCode: string } | null; entranceSet: { productCode: string } | null }
	>
): { byRevenue: OverviewProductRankRow[]; byQuantity: OverviewProductRankRow[] } {
	const rows: OverviewProductRankRow[] = groups.map((group) => {
		const product = productsByCode.get(group.productCode);
		const kind = product?.membership
			? PurchaseType.Membership
			: product?.entranceSet
				? PurchaseType.EntranceSet
				: null;
		return {
			productCode: group.productCode,
			kind,
			kindLabel: kindLabel(kind),
			count: group._count._all,
			amount: decimalToNumber(group._sum.amount)
		};
	});

	const byRevenue = [...rows]
		.sort((a, b) => b.amount - a.amount || b.count - a.count || a.productCode.localeCompare(b.productCode))
		.slice(0, PRODUCT_RANK_LIMIT);

	const byQuantity = [...rows]
		.sort((a, b) => b.count - a.count || b.amount - a.amount || a.productCode.localeCompare(b.productCode))
		.slice(0, PRODUCT_RANK_LIMIT);

	return { byRevenue, byQuantity };
}

export async function getOverviewStats(
	period: OverviewPeriod,
	options?: { atRiskDays?: number }
): Promise<OverviewStats> {
	await requireRole("Employee");

	const { from, to } = resolvePeriodBounds(period);
	const atRiskDays = normalizeAtRiskDays(options?.atRiskDays);
	const dateFilter = { gte: from, lte: to };
	const asOf = to;

	const [
		purchaseAgg,
		membershipAgg,
		entranceSetAgg,
		paymentAgg,
		paymentGroups,
		productGroups,
		entranceCount,
		hourRows,
		weekdayRows,
		monthRows,
		entranceDayRows,
		purchaseDayRows,
		activeClientPurchases,
		periodPurchases,
		clientsWithPriorPurchase
	] = await Promise.all([
		db.purchase.aggregate({
			where: { date: dateFilter },
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.purchase.aggregate({
			where: {
				date: dateFilter,
				prodotto: { membership: { isNot: null } }
			},
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.purchase.aggregate({
			where: {
				date: dateFilter,
				prodotto: { entranceSet: { isNot: null } }
			},
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.payment.aggregate({
			where: { date: dateFilter },
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.payment.groupBy({
			by: ["type"],
			where: { date: dateFilter },
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.purchase.groupBy({
			by: ["productCode"],
			where: { date: dateFilter },
			_sum: { amount: true },
			_count: { _all: true }
		}),
		db.entrance.count({
			where: { date: dateFilter }
		}),
		// Frequenza: aggregati MySQL su colonne calendario (non serie temporale ticket 02).
		db.$queryRaw<RawBucketRow[]>`
			SELECT HOUR(data) AS bucket, COUNT(*) AS count
			FROM ingressi
			WHERE data >= ${from} AND data <= ${to}
			GROUP BY HOUR(data)
			ORDER BY bucket
		`,
		db.$queryRaw<RawBucketRow[]>`
			SELECT WEEKDAY(data) AS bucket, COUNT(*) AS count
			FROM ingressi
			WHERE data >= ${from} AND data <= ${to}
			GROUP BY WEEKDAY(data)
			ORDER BY bucket
		`,
		db.$queryRaw<RawBucketRow[]>`
			SELECT MONTH(data) AS bucket, COUNT(*) AS count
			FROM ingressi
			WHERE data >= ${from} AND data <= ${to}
			GROUP BY MONTH(data)
			ORDER BY bucket
		`,
		db.$queryRaw<RawDayCountRow[]>`
			SELECT DATE(data) AS day, COUNT(*) AS count
			FROM ingressi
			WHERE data >= ${from} AND data <= ${to}
			GROUP BY DATE(data)
			ORDER BY day
		`,
		db.$queryRaw<RawDayCountRow[]>`
			SELECT DATE(data) AS day, COUNT(*) AS count
			FROM acquisti
			WHERE data >= ${from} AND data <= ${to}
			GROUP BY DATE(data)
			ORDER BY day
		`,
		db.purchase.findMany({
			where: { entrances: { some: { date: dateFilter } } },
			select: { clientId: true },
			distinct: ["clientId"]
		}),
		db.purchase.findMany({
			where: { date: dateFilter },
			select: { id: true, clientId: true, date: true },
			orderBy: [{ date: "asc" }, { id: "asc" }]
		}),
		db.purchase.findMany({
			where: { date: { lt: from } },
			select: { clientId: true },
			distinct: ["clientId"]
		})
	]);

	const byHour = fillHourBuckets(normalizeBucketRows(hourRows));
	const byWeekday = fillWeekdayBuckets(normalizeBucketRows(weekdayRows));
	const byMonth = fillMonthBuckets(normalizeBucketRows(monthRows));

	const entrancesByDay = new Map<string, number>();
	for (const row of entranceDayRows) {
		entrancesByDay.set(dayKeyFromSql(row.day), toInt(row.count));
	}
	const purchasesByDay = new Map<string, number>();
	for (const row of purchaseDayRows) {
		purchasesByDay.set(dayKeyFromSql(row.day), toInt(row.count));
	}

	const dayKeys = eachDayOfInterval({ start: from, end: to }).map((d) => format(d, "yyyy-MM-dd"));
	const deskByDay = buildDeskDays(dayKeys, entrancesByDay, purchasesByDay, (key) => {
		const [y, m, d] = key.split("-").map(Number);
		return format(new Date(y, m - 1, d), "dd/MM");
	});

	const productCodes = productGroups.map((row) => row.productCode);
	const products =
		productCodes.length === 0
			? []
			: await db.product.findMany({
					where: { code: { in: productCodes } },
					select: {
						code: true,
						membership: { select: { productCode: true } },
						entranceSet: { select: { productCode: true } }
					}
				});

	const productsByCode = new Map(products.map((product) => [product.code, product]));
	const productRanking = buildProductRanking(productGroups, productsByCode);

	const paymentByType = new Map(
		paymentGroups.map((row) => [
			row.type,
			{
				count: row._count._all,
				amount: decimalToNumber(row._sum.amount)
			}
		])
	);

	const purchaseTotal = decimalToNumber(purchaseAgg._sum.amount);
	const paymentTotal = decimalToNumber(paymentAgg._sum.amount);

	const priorClientIds = new Set(clientsWithPriorPurchase.map((row) => row.clientId));
	const { renewalsCount, renewingClientsCount } = countRenewalsInPeriod(
		periodPurchases,
		priorClientIds
	);

	const retention = await loadRetentionAtRisk({
		asOf,
		atRiskDays,
		activeClients: activeClientPurchases.length,
		renewalsCount,
		renewingClientsCount
	});

	return {
		period,
		from: from.toISOString(),
		to: to.toISOString(),
		purchases: {
			totalAmount: purchaseTotal,
			count: purchaseAgg._count._all,
			byKind: [
				{
					key: PurchaseType.Membership,
					label: "Abbonamento",
					count: membershipAgg._count._all,
					amount: decimalToNumber(membershipAgg._sum.amount)
				},
				{
					key: PurchaseType.EntranceSet,
					label: "Pacchetto ingressi",
					count: entranceSetAgg._count._all,
					amount: decimalToNumber(entranceSetAgg._sum.amount)
				}
			]
		},
		payments: {
			totalAmount: paymentTotal,
			count: paymentAgg._count._all,
			byType: PAYMENT_TYPES.map((type) => {
				const row = paymentByType.get(type);
				return {
					key: type,
					label: paymentTypeLabel[type],
					count: row?.count ?? 0,
					amount: row?.amount ?? 0
				};
			})
		},
		productRanking,
		entrances: {
			count: entranceCount
		},
		frequency: {
			byHour,
			byWeekday,
			byMonth,
			peaks: {
				hour: peakBucket(byHour),
				weekday: peakBucket(byWeekday),
				month: peakBucket(byMonth)
			}
		},
		deskLoad: {
			byDay: deskByDay,
			peakDay: peakDeskDay(deskByDay)
		},
		balance: purchaseTotal - paymentTotal,
		retention
	};
}

async function loadRetentionAtRisk(args: {
	asOf: Date;
	atRiskDays: AtRiskDays;
	activeClients: number;
	renewalsCount: number;
	renewingClientsCount: number;
}): Promise<OverviewRetention> {
	const { asOf, atRiskDays, activeClients, renewalsCount, renewingClientsCount } = args;

	// Candidati titolo: Abbonamenti non ancora scaduti per data di vendita grezza
	// (filtro stretto in JS con snapshot) + tutti i Pacchetti (residuo in JS).
	const [membershipPurchases, packagePurchases] = await Promise.all([
		db.purchase.findMany({
			where: {
				membershipDuration: { not: null },
				date: { lte: asOf }
			},
			select: {
				id: true,
				clientId: true,
				date: true,
				membershipDuration: true,
				entranceNumber: true,
				client: { select: { id: true, name: true, surname: true } },
				_count: { select: { entrances: true } }
			}
		}),
		db.purchase.findMany({
			where: { entranceNumber: { not: null } },
			select: {
				id: true,
				clientId: true,
				date: true,
				membershipDuration: true,
				entranceNumber: true,
				client: { select: { id: true, name: true, surname: true } },
				_count: { select: { entrances: true } }
			}
		})
	]);

	const byClient = new Map<
		number,
		{
			client: { id: number; name: string; surname: string };
			purchases: ClientActivityInput["purchases"];
		}
	>();

	for (const purchase of [...membershipPurchases, ...packagePurchases]) {
		const mapped = {
			id: purchase.id,
			date: purchase.date,
			membershipDuration: purchase.membershipDuration,
			entranceNumber: purchase.entranceNumber,
			usedEntrances: purchase._count.entrances
		};
		if (!isPurchaseRelevantAt(mapped, asOf)) continue;

		const existing = byClient.get(purchase.clientId);
		if (existing) {
			existing.purchases.push(mapped);
		} else {
			byClient.set(purchase.clientId, {
				client: purchase.client,
				purchases: [mapped]
			});
		}
	}

	const clientIds = [...byClient.keys()];
	const lastEntranceByClient = new Map<number, Date>();

	if (clientIds.length > 0) {
		const purchasesWithLastEntrance = await db.purchase.findMany({
			where: { clientId: { in: clientIds } },
			select: {
				clientId: true,
				entrances: {
					orderBy: { date: "desc" },
					take: 1,
					select: { date: true }
				}
			}
		});

		for (const purchase of purchasesWithLastEntrance) {
			const last = purchase.entrances[0]?.date;
			if (!last) continue;
			const prev = lastEntranceByClient.get(purchase.clientId);
			if (!prev || last > prev) {
				lastEntranceByClient.set(purchase.clientId, last);
			}
		}
	}

	const activity: ClientActivityInput[] = clientIds.map((clientId) => ({
		clientId,
		purchases: byClient.get(clientId)!.purchases,
		lastEntranceAt: lastEntranceByClient.get(clientId) ?? null
	}));

	const atRisk = listAtRiskClients(activity, asOf, atRiskDays);
	const atRiskSample: OverviewAtRiskRow[] = atRisk.slice(0, AT_RISK_SAMPLE_LIMIT).map((row) => {
		const client = byClient.get(row.clientId)!.client;
		return {
			clientId: row.clientId,
			clientLabel: personLabel(client),
			daysSinceLastEntrance: row.daysSinceLastEntrance,
			titleKind: row.titleKind
		};
	});

	return {
		activeClients,
		renewalsCount,
		renewingClientsCount,
		atRiskDays,
		atRiskCount: atRisk.length,
		atRiskSample
	};
}
