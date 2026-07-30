/**
 * Proxy OLTP di fidelizzazione (niente ML / LTV predittivo).
 * Usa solo snapshot Acquisto (durata / N) + Ingressi collegati.
 */
import {
	isEntranceSetPurchase,
	isMembershipPurchase,
	membershipCoversAt,
	packageResidual,
	type PurchaseAccessSnapshot,
} from "@/lib/domain/purchase-access";
import { differenceInCalendarDays } from "date-fns";

/** Giorni senza Ingresso oltre i quali un Cliente con titolo valido/scaduto di recente è “a rischio”. */
export const FIDELITY_AT_RISK_DAYS = 14;

/** Finestra “scaduto/esaurito di recente” (più ampia del silenzio, così i due criteri possono coincidere). */
export const FIDELITY_RECENTLY_EXPIRED_DAYS = 30;

export const FIDELITY_ACTIVE_DEFINITION =
	"Cliente con almeno un Ingresso nel periodo selezionato.";

export const FIDELITY_RENEWAL_DEFINITION =
	"Acquisto nel periodo da un Cliente che aveva già almeno un Acquisto precedente.";

export const FIDELITY_AT_RISK_DEFINITION = `Nessun Ingresso da almeno ${FIDELITY_AT_RISK_DAYS} giorni, con titolo ancora valido (snapshot durata/N) oppure scaduto/esaurito negli ultimi ${FIDELITY_RECENTLY_EXPIRED_DAYS} giorni.`;

export type FidelityPurchaseInput = PurchaseAccessSnapshot & {
	id: number;
	clientId: number;
	entrancesLinked: number;
};

export type FidelityEntranceInput = {
	clientId: number;
	date: Date;
};

export type FidelityClientInput = {
	id: number;
	name: string;
	surname: string;
};

export type FidelityAtRiskRow = {
	clientId: number;
	name: string;
	surname: string;
	daysSinceLastEntrance: number | null;
	lastEntranceIso: string | null;
	titleStatus: "valid" | "recently_expired";
};

export type FidelityProxyResult = {
	atRiskDays: number;
	recentlyExpiredDays: number;
	activeClientsCount: number;
	renewalsCount: number;
	renewingClientsCount: number;
	atRiskCount: number;
	atRisk: FidelityAtRiskRow[];
};

function membershipEndExclusive(purchase: Pick<PurchaseAccessSnapshot, "date" | "duration">): Date | null {
	if (purchase.duration == null) return null;
	return new Date(purchase.date.getTime() + purchase.duration * 24 * 60 * 60 * 1000);
}

function inInclusiveRange(date: Date, from: Date, to: Date): boolean {
	const t = date.getTime();
	return t >= from.getTime() && t <= to.getTime();
}

function hasValidTitleAt(purchases: FidelityPurchaseInput[], at: Date): boolean {
	return purchases.some((purchase) => {
		if (isMembershipPurchase(purchase) && membershipCoversAt(purchase, at)) {
			return true;
		}
		if (isEntranceSetPurchase(purchase)) {
			const residual = packageResidual(purchase, purchase.entrancesLinked);
			return residual != null && residual > 0;
		}
		return false;
	});
}

/** Abbonamento scaduto di recente: fine esclusiva in (at − N, at]. */
function hasRecentlyExpiredMembership(
	purchases: FidelityPurchaseInput[],
	at: Date,
	withinDays: number
): boolean {
	const windowStart = new Date(at.getTime() - withinDays * 24 * 60 * 60 * 1000);
	return purchases.some((purchase) => {
		if (!isMembershipPurchase(purchase)) return false;
		const end = membershipEndExclusive(purchase);
		if (end == null) return false;
		return end.getTime() <= at.getTime() && end.getTime() > windowStart.getTime();
	});
}

/**
 * Pacchetto esaurito di recente: residuo ≤ 0 e l’ultimo Ingresso collegato
 * cade negli ultimi `withinDays` rispetto a `at`.
 */
function hasRecentlyExhaustedPackage(
	purchases: FidelityPurchaseInput[],
	entrancesByPurchaseId: Map<number, Date[]>,
	at: Date,
	withinDays: number
): boolean {
	const windowStart = new Date(at.getTime() - withinDays * 24 * 60 * 60 * 1000);
	return purchases.some((purchase) => {
		if (!isEntranceSetPurchase(purchase)) return false;
		const residual = packageResidual(purchase, purchase.entrancesLinked);
		if (residual == null || residual > 0) return false;
		const dates = entrancesByPurchaseId.get(purchase.id) ?? [];
		if (dates.length === 0) return false;
		const last = dates.reduce((max, cur) =>
			cur.getTime() > max.getTime() ? cur : max
		);
		return last.getTime() > windowStart.getTime() && last.getTime() <= at.getTime();
	});
}

/** Clienti distinti con ≥1 Ingresso in [from, to]. */
export function countActiveClients(
	entrances: FidelityEntranceInput[],
	from: Date,
	to: Date
): number {
	const ids = new Set<number>();
	for (const entrance of entrances) {
		if (inInclusiveRange(entrance.date, from, to)) {
			ids.add(entrance.clientId);
		}
	}
	return ids.size;
}

/**
 * Riacquisti/rinnovi: Acquisti in [from, to] di Clienti con almeno un Acquisto precedente
 * (data strettamente precedente).
 */
export function countRenewals(
	purchases: Pick<FidelityPurchaseInput, "clientId" | "date">[],
	from: Date,
	to: Date
): { renewalsCount: number; renewingClientsCount: number } {
	const byClient = new Map<number, Date[]>();
	for (const purchase of purchases) {
		const list = byClient.get(purchase.clientId) ?? [];
		list.push(purchase.date);
		byClient.set(purchase.clientId, list);
	}
	for (const list of byClient.values()) {
		list.sort((a, b) => a.getTime() - b.getTime());
	}

	let renewalsCount = 0;
	const renewingClients = new Set<number>();
	for (const purchase of purchases) {
		if (!inInclusiveRange(purchase.date, from, to)) continue;
		const dates = byClient.get(purchase.clientId) ?? [];
		const hasPrior = dates.some((d) => d.getTime() < purchase.date.getTime());
		if (!hasPrior) continue;
		renewalsCount += 1;
		renewingClients.add(purchase.clientId);
	}
	return { renewalsCount, renewingClientsCount: renewingClients.size };
}

export function listAtRiskClients(args: {
	clients: FidelityClientInput[];
	purchases: FidelityPurchaseInput[];
	entrances: FidelityEntranceInput[];
	/** Date Ingresso per id Acquisto (per esaurimento pacchetto recente). */
	entrancesByPurchaseId: Map<number, Date[]>;
	asOf: Date;
	atRiskDays?: number;
	recentlyExpiredDays?: number;
}): FidelityAtRiskRow[] {
	const atRiskDays = args.atRiskDays ?? FIDELITY_AT_RISK_DAYS;
	const recentlyExpiredDays = args.recentlyExpiredDays ?? FIDELITY_RECENTLY_EXPIRED_DAYS;
	const purchasesByClient = new Map<number, FidelityPurchaseInput[]>();
	for (const purchase of args.purchases) {
		const list = purchasesByClient.get(purchase.clientId) ?? [];
		list.push(purchase);
		purchasesByClient.set(purchase.clientId, list);
	}

	const lastEntranceByClient = new Map<number, Date>();
	for (const entrance of args.entrances) {
		const prev = lastEntranceByClient.get(entrance.clientId);
		if (!prev || entrance.date.getTime() > prev.getTime()) {
			lastEntranceByClient.set(entrance.clientId, entrance.date);
		}
	}

	const rows: FidelityAtRiskRow[] = [];
	for (const client of args.clients) {
		const purchases = purchasesByClient.get(client.id) ?? [];
		if (purchases.length === 0) continue;

		const lastEntrance = lastEntranceByClient.get(client.id) ?? null;
		let silentTooLong: boolean;
		if (lastEntrance == null) {
			const earliestPurchase = purchases.reduce((min, p) =>
				p.date.getTime() < min.getTime() ? p.date : min
			, purchases[0]!.date);
			silentTooLong =
				differenceInCalendarDays(args.asOf, earliestPurchase) >= atRiskDays;
		} else {
			silentTooLong =
				differenceInCalendarDays(args.asOf, lastEntrance) >= atRiskDays;
		}
		if (!silentTooLong) continue;

		const valid = hasValidTitleAt(purchases, args.asOf);
		const recentlyExpired =
			!valid &&
			(hasRecentlyExpiredMembership(purchases, args.asOf, recentlyExpiredDays) ||
				hasRecentlyExhaustedPackage(
					purchases,
					args.entrancesByPurchaseId,
					args.asOf,
					recentlyExpiredDays
				));
		if (!valid && !recentlyExpired) continue;

		rows.push({
			clientId: client.id,
			name: client.name,
			surname: client.surname,
			daysSinceLastEntrance:
				lastEntrance == null
					? null
					: differenceInCalendarDays(args.asOf, lastEntrance),
			lastEntranceIso: lastEntrance?.toISOString() ?? null,
			titleStatus: valid ? "valid" : "recently_expired",
		});
	}

	rows.sort((a, b) => {
		const da = a.daysSinceLastEntrance ?? Number.POSITIVE_INFINITY;
		const db = b.daysSinceLastEntrance ?? Number.POSITIVE_INFINITY;
		if (db !== da) return db - da;
		return a.surname.localeCompare(b.surname, "it") || a.name.localeCompare(b.name, "it");
	});
	return rows;
}

export function computeFidelityProxy(args: {
	clients: FidelityClientInput[];
	purchases: FidelityPurchaseInput[];
	entrances: FidelityEntranceInput[];
	entrancesByPurchaseId: Map<number, Date[]>;
	from: Date;
	to: Date;
	asOf?: Date;
	atRiskDays?: number;
	recentlyExpiredDays?: number;
}): FidelityProxyResult {
	const atRiskDays = args.atRiskDays ?? FIDELITY_AT_RISK_DAYS;
	const recentlyExpiredDays = args.recentlyExpiredDays ?? FIDELITY_RECENTLY_EXPIRED_DAYS;
	const asOf = args.asOf ?? args.to;
	const activeClientsCount = countActiveClients(args.entrances, args.from, args.to);
	const { renewalsCount, renewingClientsCount } = countRenewals(
		args.purchases,
		args.from,
		args.to
	);
	const atRisk = listAtRiskClients({
		clients: args.clients,
		purchases: args.purchases,
		entrances: args.entrances,
		entrancesByPurchaseId: args.entrancesByPurchaseId,
		asOf,
		atRiskDays,
		recentlyExpiredDays,
	});
	return {
		atRiskDays,
		recentlyExpiredDays,
		activeClientsCount,
		renewalsCount,
		renewingClientsCount,
		atRiskCount: atRisk.length,
		atRisk,
	};
}
