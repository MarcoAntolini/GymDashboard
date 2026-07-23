/**
 * Domain helpers for Acquisto snapshots (durata / numero ingressi).
 * Residuo and membership validity MUST read these fields — never the live Prodotto.
 */

export type PurchaseSnapshot = {
	date: Date;
	duration: number | null;
	entranceNumber: number | null;
};

/** Residuo pacchetto: snapshot N − ingressi già collegati. Null se non è un pacchetto. */
export function remainingEntrancesForPurchase(
	purchase: Pick<PurchaseSnapshot, "entranceNumber">,
	usedEntranceCount: number
): number | null {
	if (purchase.entranceNumber == null) {
		return null;
	}
	if (usedEntranceCount < 0) {
		throw new Error("usedEntranceCount must be non-negative");
	}
	return purchase.entranceNumber - usedEntranceCount;
}

/**
 * Validità abbonamento: finestra semiaperta [data, data + durata giorni).
 * Usa solo lo snapshot durata sull'Acquisto.
 */
export function isMembershipValidAt(
	purchase: Pick<PurchaseSnapshot, "date" | "duration">,
	at: Date
): boolean {
	if (purchase.duration == null) {
		return false;
	}
	const start = purchase.date.getTime();
	const end = addDaysUtc(purchase.date, purchase.duration).getTime();
	const t = at.getTime();
	return t >= start && t < end;
}

/** True se l'Acquisto può giustificare un Ingresso al momento `at` (senza tie-break tra più titoli). */
export function canJustifyEntranceAt(
	purchase: PurchaseSnapshot,
	at: Date,
	usedEntranceCount: number
): boolean {
	if (purchase.duration != null) {
		return isMembershipValidAt(purchase, at);
	}
	if (purchase.entranceNumber != null) {
		const remaining = remainingEntrancesForPurchase(purchase, usedEntranceCount);
		return remaining != null && remaining > 0;
	}
	return false;
}

function addDaysUtc(date: Date, days: number): Date {
	const result = new Date(date.getTime());
	result.setUTCDate(result.getUTCDate() + days);
	return result;
}
