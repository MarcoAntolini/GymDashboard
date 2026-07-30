"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PAYMENT_TYPE_LABEL } from "@/lib/domain/labels";
import { PRODUCT_KIND_LABEL, ProductKind, productKindFromSnapshot } from "@/lib/domain/product-kind";
import {
	computeFidelityProxy,
	FIDELITY_ACTIVE_DEFINITION,
	FIDELITY_AT_RISK_DEFINITION,
	FIDELITY_RENEWAL_DEFINITION,
	type FidelityAtRiskRow,
	type FidelityProxyResult,
} from "@/lib/fidelity-proxy";
import {
	aggregateBanconeDaily,
	computeEntranceFrequency,
	type BanconeDailyPoint,
	type EntranceFrequency,
} from "@/lib/frequency-aggregation";
import {
	isOverviewPeriodPreset,
	overviewPeriodCaption,
	rangeForOverviewPreset,
	type OverviewPeriodPreset,
} from "@/lib/overview-period";
import {
	rankProductsByRevenue,
	type ProductRankingRow,
} from "@/lib/product-ranking";
import { PaymentType } from "@prisma/client";

export type OverviewBreakdownRow = {
	key: string;
	label: string;
	amount: number;
	count: number;
};

export type { ProductRankingRow, FidelityAtRiskRow };

export type OverviewFidelity = FidelityProxyResult & {
	activeDefinition: string;
	renewalDefinition: string;
	atRiskDefinition: string;
};

export type OverviewStats = {
	preset: OverviewPeriodPreset;
	fromIso: string;
	toIso: string;
	periodCaption: string;
	entrate: number;
	uscite: number;
	saldo: number;
	ingressiCount: number;
	entrateByKind: OverviewBreakdownRow[];
	usciteByType: OverviewBreakdownRow[];
	/** Ranking prodotti per ricavo (poi quantita) nel periodo. */
	productRanking: ProductRankingRow[];
	/** Picchi affluenza Ingressi (ora / weekday / mese-dell'anno). */
	entranceFrequency: EntranceFrequency;
	/** Volume operativo Ingressi + Acquisti per giorno. */
	banconeDaily: BanconeDailyPoint[];
	/** Proxy fidelizzazione OLTP (attivi / riacquisti / a rischio). */
	fidelity: OverviewFidelity;
	/** Nessun Acquisto, Pagamento ne Ingresso nel periodo. */
	isEmpty: boolean;
};

const PAYMENT_TYPE_ORDER: PaymentType[] = [
	PaymentType.Salary,
	PaymentType.Bill,
	PaymentType.Equipment,
	PaymentType.Intervention,
];

const PURCHASE_KIND_ORDER: ProductKind[] = [ProductKind.Membership, ProductKind.EntranceSet];

/**
 * Aggregate operativi per la Panoramica: Entrate (Acquisti), Uscite (Pagamenti),
 * Ingressi e ripartizioni per tipo — non vanity KPI.
 */
export async function getOverviewStats(preset: OverviewPeriodPreset): Promise<OverviewStats> {
	await requireRole("Employee");

	if (!isOverviewPeriodPreset(preset)) {
		throw new Error("Periodo panoramica non valido");
	}

	const { from, to } = rangeForOverviewPreset(preset);
	const dateFilter = { gte: from, lte: to };

	const [purchases, payments, entrances, fidelityPurchases, fidelityEntrances, clients] =
		await Promise.all([
			db.purchase.findMany({
				where: { date: dateFilter },
				select: {
					amount: true,
					productCode: true,
					duration: true,
					entranceNumber: true,
					date: true,
				},
			}),
			db.payment.findMany({
				where: { date: dateFilter },
				select: { amount: true, type: true },
			}),
			db.entrance.findMany({
				where: { date: dateFilter },
				select: { date: true },
			}),
			db.purchase.findMany({
				select: {
					id: true,
					clientId: true,
					date: true,
					duration: true,
					entranceNumber: true,
					_count: { select: { entrance: true } },
				},
			}),
			db.entrance.findMany({
				select: {
					date: true,
					purchaseId: true,
					purchase: { select: { clientId: true } },
				},
			}),
			db.client.findMany({
				select: { id: true, name: true, surname: true },
			}),
		]);
	const ingressiCount = entrances.length;
	const entranceDates = entrances.map((row) => row.date);
	const purchaseDates = purchases.map((row) => row.date);
	const entranceFrequency = computeEntranceFrequency(entranceDates);
	const banconeDaily = aggregateBanconeDaily(entranceDates, purchaseDates, from, to);

	const entrancesByPurchaseId = new Map<number, Date[]>();
	const fidelityEntranceInputs = fidelityEntrances.map((row) => {
		const list = entrancesByPurchaseId.get(row.purchaseId) ?? [];
		list.push(row.date);
		entrancesByPurchaseId.set(row.purchaseId, list);
		return { clientId: row.purchase.clientId, date: row.date };
	});
	const fidelityProxy = computeFidelityProxy({
		clients,
		purchases: fidelityPurchases.map((row) => ({
			id: row.id,
			clientId: row.clientId,
			date: row.date,
			duration: row.duration,
			entranceNumber: row.entranceNumber,
			entrancesLinked: row._count.entrance,
		})),
		entrances: fidelityEntranceInputs,
		entrancesByPurchaseId,
		from,
		to,
		asOf: to,
	});
	const fidelity: OverviewFidelity = {
		...fidelityProxy,
		activeDefinition: FIDELITY_ACTIVE_DEFINITION,
		renewalDefinition: FIDELITY_RENEWAL_DEFINITION,
		atRiskDefinition: FIDELITY_AT_RISK_DEFINITION,
	};

	const entrateByKindMap = new Map(
		PURCHASE_KIND_ORDER.map((kind) => [kind, { amount: 0, count: 0 }])
	);
	const rankingInput: {
		productCode: string;
		amount: number;
		duration: number | null;
		entranceNumber: number | null;
	}[] = [];
	let entrate = 0;
	for (const row of purchases) {
		const amount = Number(row.amount);
		entrate += amount;
		const kind = productKindFromSnapshot(row);
		const bucket = entrateByKindMap.get(kind) ?? { amount: 0, count: 0 };
		bucket.amount += amount;
		bucket.count += 1;
		entrateByKindMap.set(kind, bucket);
		rankingInput.push({
			productCode: row.productCode,
			amount,
			duration: row.duration,
			entranceNumber: row.entranceNumber,
		});
	}
	const productRanking = rankProductsByRevenue(rankingInput);

	const usciteByTypeMap = new Map(
		PAYMENT_TYPE_ORDER.map((type) => [type, { amount: 0, count: 0 }])
	);
	let uscite = 0;
	for (const row of payments) {
		const amount = Number(row.amount);
		uscite += amount;
		const bucket = usciteByTypeMap.get(row.type) ?? { amount: 0, count: 0 };
		bucket.amount += amount;
		bucket.count += 1;
		usciteByTypeMap.set(row.type, bucket);
	}

	const entrateByKind: OverviewBreakdownRow[] = PURCHASE_KIND_ORDER.map((kind) => {
		const bucket = entrateByKindMap.get(kind) ?? { amount: 0, count: 0 };
		return {
			key: kind,
			label: PRODUCT_KIND_LABEL[kind],
			amount: bucket.amount,
			count: bucket.count,
		};
	});

	const usciteByType: OverviewBreakdownRow[] = PAYMENT_TYPE_ORDER.map((type) => {
		const bucket = usciteByTypeMap.get(type) ?? { amount: 0, count: 0 };
		return {
			key: type,
			label: PAYMENT_TYPE_LABEL[type],
			amount: bucket.amount,
			count: bucket.count,
		};
	});

	return {
		preset,
		fromIso: from.toISOString(),
		toIso: to.toISOString(),
		periodCaption: overviewPeriodCaption(preset, from, to),
		entrate,
		uscite,
		saldo: entrate - uscite,
		ingressiCount,
		entrateByKind,
		usciteByType,
		productRanking,
		entranceFrequency,
		banconeDaily,
		fidelity,
		isEmpty: purchases.length === 0 && payments.length === 0 && ingressiCount === 0,
	};
}
