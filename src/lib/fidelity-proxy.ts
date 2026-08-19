/**
 * Proxy OLTP di fidelizzazione (niente ML / LTV predittivo).
 * Usa solo snapshot Vendita (durata / N) + Ingressi collegati.
 */
import {
	isEntranceSetSale,
	isMembershipSale,
	membershipCoversAt,
	packageResidual,
	type SaleAccessSnapshot,
} from "@/lib/domain/sale-access";
import { differenceInCalendarDays } from "date-fns";

/** Giorni senza Ingresso oltre i quali un Cliente con titolo valido/scaduto di recente è “a rischio”. */
export const FIDELITY_AT_RISK_DAYS = 14;

/** Finestra “scaduto/esaurito di recente” (più ampia del silenzio, così i due criteri possono coincidere). */
export const FIDELITY_RECENTLY_EXPIRED_DAYS = 30;

export const FIDELITY_ACTIVE_DEFINITION =
	"Cliente con almeno un Ingresso nel periodo selezionato.";

export const FIDELITY_RENEWAL_DEFINITION =
	"Vendita nel periodo da un Cliente che aveva già almeno una Vendita precedente.";

export const FIDELITY_AT_RISK_DEFINITION = `Nessun Ingresso da almeno ${FIDELITY_AT_RISK_DAYS} giorni, con titolo ancora valido (snapshot durata/N) oppure scaduto/esaurito negli ultimi ${FIDELITY_RECENTLY_EXPIRED_DAYS} giorni.`;

export type FidelitySaleInput = SaleAccessSnapshot & {
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

function membershipEndExclusive(sale: Pick<SaleAccessSnapshot, "date" | "duration">): Date | null {
	if (sale.duration == null) return null;
	return new Date(sale.date.getTime() + sale.duration * 24 * 60 * 60 * 1000);
}

function inInclusiveRange(date: Date, from: Date, to: Date): boolean {
	const t = date.getTime();
	return t >= from.getTime() && t <= to.getTime();
}

function hasValidTitleAt(sales: FidelitySaleInput[], at: Date): boolean {
	return sales.some((sale) => {
		if (isMembershipSale(sale) && membershipCoversAt(sale, at)) {
			return true;
		}
		if (isEntranceSetSale(sale)) {
			const residual = packageResidual(sale, sale.entrancesLinked);
			return residual != null && residual > 0;
		}
		return false;
	});
}

/** Abbonamento scaduto di recente: fine esclusiva in (at − N, at]. */
function hasRecentlyExpiredMembership(
	sales: FidelitySaleInput[],
	at: Date,
	withinDays: number
): boolean {
	const windowStart = new Date(at.getTime() - withinDays * 24 * 60 * 60 * 1000);
	return sales.some((sale) => {
		if (!isMembershipSale(sale)) return false;
		const end = membershipEndExclusive(sale);
		if (end == null) return false;
		return end.getTime() <= at.getTime() && end.getTime() > windowStart.getTime();
	});
}

/**
 * Pacchetto esaurito di recente: residuo ≤ 0 e l’ultimo Ingresso collegato
 * cade negli ultimi `withinDays` rispetto a `at`.
 */
function hasRecentlyExhaustedPackage(
	sales: FidelitySaleInput[],
	entrancesBySaleId: Map<number, Date[]>,
	at: Date,
	withinDays: number
): boolean {
	const windowStart = new Date(at.getTime() - withinDays * 24 * 60 * 60 * 1000);
	return sales.some((sale) => {
		if (!isEntranceSetSale(sale)) return false;
		const residual = packageResidual(sale, sale.entrancesLinked);
		if (residual == null || residual > 0) return false;
		const dates = entrancesBySaleId.get(sale.id) ?? [];
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
 * Rinnovi: Vendite in [from, to] di Clienti con almeno una Vendita precedente
 * (data strettamente precedente).
 */
export function countRenewals(
	sales: Pick<FidelitySaleInput, "clientId" | "date">[],
	from: Date,
	to: Date
): { renewalsCount: number; renewingClientsCount: number } {
	const byClient = new Map<number, Date[]>();
	for (const sale of sales) {
		const list = byClient.get(sale.clientId) ?? [];
		list.push(sale.date);
		byClient.set(sale.clientId, list);
	}
	for (const list of byClient.values()) {
		list.sort((a, b) => a.getTime() - b.getTime());
	}

	let renewalsCount = 0;
	const renewingClients = new Set<number>();
	for (const sale of sales) {
		if (!inInclusiveRange(sale.date, from, to)) continue;
		const dates = byClient.get(sale.clientId) ?? [];
		const hasPrior = dates.some((d) => d.getTime() < sale.date.getTime());
		if (!hasPrior) continue;
		renewalsCount += 1;
		renewingClients.add(sale.clientId);
	}
	return { renewalsCount, renewingClientsCount: renewingClients.size };
}

export function listAtRiskClients(args: {
	clients: FidelityClientInput[];
	sales: FidelitySaleInput[];
	entrances: FidelityEntranceInput[];
	/** Date Ingresso per id Vendita (per esaurimento pacchetto recente). */
	entrancesBySaleId: Map<number, Date[]>;
	asOf: Date;
	atRiskDays?: number;
	recentlyExpiredDays?: number;
}): FidelityAtRiskRow[] {
	const atRiskDays = args.atRiskDays ?? FIDELITY_AT_RISK_DAYS;
	const recentlyExpiredDays = args.recentlyExpiredDays ?? FIDELITY_RECENTLY_EXPIRED_DAYS;
	const salesByClient = new Map<number, FidelitySaleInput[]>();
	for (const sale of args.sales) {
		const list = salesByClient.get(sale.clientId) ?? [];
		list.push(sale);
		salesByClient.set(sale.clientId, list);
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
		const sales = salesByClient.get(client.id) ?? [];
		if (sales.length === 0) continue;

		const lastEntrance = lastEntranceByClient.get(client.id) ?? null;
		let silentTooLong: boolean;
		if (lastEntrance == null) {
			const earliestSale = sales.reduce((min, p) =>
				p.date.getTime() < min.getTime() ? p.date : min
			, sales[0]!.date);
			silentTooLong =
				differenceInCalendarDays(args.asOf, earliestSale) >= atRiskDays;
		} else {
			silentTooLong =
				differenceInCalendarDays(args.asOf, lastEntrance) >= atRiskDays;
		}
		if (!silentTooLong) continue;

		const valid = hasValidTitleAt(sales, args.asOf);
		const recentlyExpired =
			!valid &&
			(hasRecentlyExpiredMembership(sales, args.asOf, recentlyExpiredDays) ||
				hasRecentlyExhaustedPackage(
					sales,
					args.entrancesBySaleId,
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
	sales: FidelitySaleInput[];
	entrances: FidelityEntranceInput[];
	entrancesBySaleId: Map<number, Date[]>;
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
		args.sales,
		args.from,
		args.to
	);
	const atRisk = listAtRiskClients({
		clients: args.clients,
		sales: args.sales,
		entrances: args.entrances,
		entrancesBySaleId: args.entrancesBySaleId,
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
