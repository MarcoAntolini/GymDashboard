/**
 * Proxy OLTP di fidelizzazione.
 * La rilevanza del titolo usa gli snapshot sull'Acquisto
 * (`membershipDuration` / `entranceNumber`), non i valori live del Prodotto.
 */

import { differenceInCalendarDays } from "date-fns";
import {
	isMembershipValidAt,
	packageResidual
} from "@/lib/entrance-justification";

export const DEFAULT_AT_RISK_DAYS = 14;

export const AT_RISK_DAY_OPTIONS = [7, 14, 21, 30] as const;

export type AtRiskDays = (typeof AT_RISK_DAY_OPTIONS)[number];

export type PurchaseForTitleRelevance = {
	id: number;
	date: Date;
	membershipDuration: number | null;
	entranceNumber: number | null;
	usedEntrances: number;
};

export type TitleKind = "Abbonamento" | "Pacchetto";

/** True se l'Acquisto giustifica ancora un Ingresso in `at` (snapshot-only). */
export function isPurchaseRelevantAt(
	purchase: PurchaseForTitleRelevance,
	at: Date
): boolean {
	if (purchase.membershipDuration != null) {
		return isMembershipValidAt(purchase.date, purchase.membershipDuration, at);
	}
	if (purchase.entranceNumber != null) {
		return packageResidual(purchase.entranceNumber, purchase.usedEntrances) > 0;
	}
	return false;
}

export function titleKindOf(purchase: PurchaseForTitleRelevance): TitleKind | null {
	if (purchase.membershipDuration != null) return "Abbonamento";
	if (purchase.entranceNumber != null) return "Pacchetto";
	return null;
}

/**
 * Tra gli Acquisti rilevanti in `at`, preferisce Abbonamento (il più recente),
 * altrimenti Pacchetto con residuo (FIFO: più vecchio). Allineato alla
 * giustificazione Ingressi, ma solo come etichetta di sintesi per il cliente.
 */
export function pickRelevantTitleKind(
	purchases: PurchaseForTitleRelevance[],
	at: Date
): TitleKind | null {
	const relevant = purchases.filter((p) => isPurchaseRelevantAt(p, at));
	if (relevant.length === 0) return null;

	const memberships = relevant.filter((p) => p.membershipDuration != null);
	if (memberships.length > 0) {
		return "Abbonamento";
	}
	return "Pacchetto";
}

export type ClientActivityInput = {
	clientId: number;
	purchases: PurchaseForTitleRelevance[];
	/** Ultimo Ingresso del cliente (qualsiasi Acquisto); null = mai. */
	lastEntranceAt: Date | null;
};

export type AtRiskClient = {
	clientId: number;
	daysSinceLastEntrance: number | null;
	titleKind: TitleKind;
};

/**
 * Cliente a rischio: titolo ancora rilevante in `asOf` (snapshot) e
 * nessun Ingresso da almeno `atRiskDays` giorni di calendario
 * (oppure nessun Ingresso mai).
 */
export function isClientAtRisk(
	input: ClientActivityInput,
	asOf: Date,
	atRiskDays: number
): boolean {
	const titleKind = pickRelevantTitleKind(input.purchases, asOf);
	if (titleKind == null) return false;

	if (input.lastEntranceAt == null) return true;

	const days = differenceInCalendarDays(asOf, input.lastEntranceAt);
	return days >= atRiskDays;
}

export function listAtRiskClients(
	clients: ClientActivityInput[],
	asOf: Date,
	atRiskDays: number
): AtRiskClient[] {
	const rows: AtRiskClient[] = [];

	for (const client of clients) {
		if (!isClientAtRisk(client, asOf, atRiskDays)) continue;

		const titleKind = pickRelevantTitleKind(client.purchases, asOf);
		if (titleKind == null) continue;

		rows.push({
			clientId: client.clientId,
			daysSinceLastEntrance:
				client.lastEntranceAt == null
					? null
					: differenceInCalendarDays(asOf, client.lastEntranceAt),
			titleKind
		});
	}

	return rows.sort((a, b) => {
		// Mai entrati prima; poi più giorni senza Ingresso.
		if (a.daysSinceLastEntrance == null && b.daysSinceLastEntrance == null) {
			return a.clientId - b.clientId;
		}
		if (a.daysSinceLastEntrance == null) return -1;
		if (b.daysSinceLastEntrance == null) return 1;
		return (
			b.daysSinceLastEntrance - a.daysSinceLastEntrance || a.clientId - b.clientId
		);
	});
}

/**
 * Conta i riacquisti/rinnovi in un elenco di Acquisti già filtrati sul periodo,
 * ordinati per (date asc, id asc). Un Acquisto è rinnovo se il cliente aveva
 * già un Acquisto precedente (prima del periodo oppure già visto nel periodo).
 */
export function countRenewalsInPeriod(
	periodPurchases: { id: number; clientId: number; date: Date }[],
	clientIdsWithPurchaseBeforePeriod: ReadonlySet<number>
): { renewalsCount: number; renewingClientsCount: number } {
	const seenInPeriod = new Set<number>();
	let renewalsCount = 0;
	const renewingClients = new Set<number>();

	const ordered = [...periodPurchases].sort(
		(a, b) => a.date.getTime() - b.date.getTime() || a.id - b.id
	);

	for (const purchase of ordered) {
		const isRenewal =
			clientIdsWithPurchaseBeforePeriod.has(purchase.clientId) ||
			seenInPeriod.has(purchase.clientId);
		if (isRenewal) {
			renewalsCount += 1;
			renewingClients.add(purchase.clientId);
		}
		seenInPeriod.add(purchase.clientId);
	}

	return {
		renewalsCount,
		renewingClientsCount: renewingClients.size
	};
}
