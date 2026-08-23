"use server";

import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { PRODUCT_KIND_LABEL, ProductKind, productKindFromSnapshot } from "@/lib/domain/product-kind";
import {
	computeFidelityProxy,
	FIDELITY_ACTIVE_DEFINITION,
	FIDELITY_AT_RISK_DEFINITION,
	FIDELITY_RENEWAL_DEFINITION,
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
	/** Volume operativo Ingressi + Vendite per giorno. */
	banconeDaily: BanconeDailyPoint[];
	/** Proxy fidelizzazione OLTP (attivi / rinnovi / a rischio). */
	fidelity: OverviewFidelity;
	/** Nessuna Vendita, Pagamento ne Ingresso nel periodo. */
	isEmpty: boolean;
};

const PAYMENT_TYPE_ORDER = ["Salary", "Bill", "Equipment", "Intervention"] as const;
type PaymentTypeKey = (typeof PAYMENT_TYPE_ORDER)[number];

const PAYMENT_TYPE_LABEL: Record<PaymentTypeKey, string> = {
	Salary: "Stipendio",
	Bill: "Bolletta",
	Equipment: "Attrezzatura",
	Intervention: "Intervento",
};

const PAYMENT_TYPE_KEY_BY_VALUE = new Map<string, PaymentTypeKey>([
	["Salary", "Salary"],
	["Bill", "Bill"],
	["Equipment", "Equipment"],
	["Intervention", "Intervention"],
	[String(PaymentType.Salary), "Salary"],
	[String(PaymentType.Bill), "Bill"],
	[String(PaymentType.Equipment), "Equipment"],
	[String(PaymentType.Intervention), "Intervention"],
]);

function paymentTypeKey(type: PaymentType): PaymentTypeKey {
	const key = PAYMENT_TYPE_KEY_BY_VALUE.get(String(type));
	if (!key) throw new Error(`Tipo pagamento non riconosciuto: ${String(type)}`);
	return key;
}

const SALE_KIND_ORDER: ProductKind[] = [ProductKind.Membership, ProductKind.EntranceSet];

/**
 * Aggregate operativi per la Panoramica: Entrate (Vendite), Uscite (Pagamenti),
 * Ingressi e ripartizioni per tipo — non vanity KPI.
 */
export async function getOverviewStats(preset: OverviewPeriodPreset): Promise<OverviewStats> {
	await requireRole("Employee");

	if (!isOverviewPeriodPreset(preset)) {
		throw new Error("Periodo panoramica non valido");
	}

	const { from, to } = rangeForOverviewPreset(preset);
	const dateFilter = { gte: from, lte: to };

	const [sales, payments, entrances, fidelitySales, fidelityEntrances, clients] =
		await Promise.all([
			db.sale.findMany({
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
			db.sale.findMany({
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
					saleId: true,
					sale: { select: { clientId: true } },
				},
			}),
			db.client.findMany({
				select: { id: true, name: true, surname: true },
			}),
		]);
	const ingressiCount = entrances.length;
	const entranceDates = entrances.map((row) => row.date);
	const saleDates = sales.map((row) => row.date);
	const entranceFrequency = computeEntranceFrequency(entranceDates);
	const banconeDaily = aggregateBanconeDaily(entranceDates, saleDates, from, to);

	const entrancesBySaleId = new Map<number, Date[]>();
	const fidelityEntranceInputs = fidelityEntrances.map((row) => {
		const list = entrancesBySaleId.get(row.saleId) ?? [];
		list.push(row.date);
		entrancesBySaleId.set(row.saleId, list);
		return { clientId: row.sale.clientId, date: row.date };
	});
	const fidelityProxy = computeFidelityProxy({
		clients,
		sales: fidelitySales.map((row) => ({
			id: row.id,
			clientId: row.clientId,
			date: row.date,
			duration: row.duration,
			entranceNumber: row.entranceNumber,
			entrancesLinked: row._count.entrance,
		})),
		entrances: fidelityEntranceInputs,
		entrancesBySaleId,
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
		SALE_KIND_ORDER.map((kind) => [kind, { amount: 0, count: 0 }])
	);
	const rankingInput: {
		productCode: string;
		amount: number;
		duration: number | null;
		entranceNumber: number | null;
	}[] = [];
	let entrate = 0;
	for (const row of sales) {
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
		const key = paymentTypeKey(row.type);
		const bucket = usciteByTypeMap.get(key) ?? { amount: 0, count: 0 };
		bucket.amount += amount;
		bucket.count += 1;
		usciteByTypeMap.set(key, bucket);
	}

	const entrateByKind: OverviewBreakdownRow[] = SALE_KIND_ORDER.map((kind) => {
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
		isEmpty: sales.length === 0 && payments.length === 0 && ingressiCount === 0,
	};
}
