/**
 * Regole di accesso basate sullo snapshot Acquisto (durata / N ingressi alla vendita).
 * Non leggere mai Membership.duration / EntranceSet.entranceNumber per giustificare Ingressi.
 */

export type PurchaseAccessSnapshot = {
	date: Date;
	duration: number | null;
	entranceNumber: number | null;
};

/** Residuo pacchetto: snapshot N − ingressi già collegati. */
export function packageResidual(
	purchase: Pick<PurchaseAccessSnapshot, "entranceNumber">,
	entrancesLinked: number
): number | null {
	if (purchase.entranceNumber == null) return null;
	return purchase.entranceNumber - entrancesLinked;
}

/** True se l'Acquisto è un Abbonamento (ha durata snapshot). */
export function isMembershipPurchase(
	purchase: Pick<PurchaseAccessSnapshot, "duration" | "entranceNumber">
): boolean {
	return purchase.duration != null;
}

/** True se l'Acquisto è un Pacchetto (ha N ingressi snapshot). */
export function isEntranceSetPurchase(
	purchase: Pick<PurchaseAccessSnapshot, "duration" | "entranceNumber">
): boolean {
	return purchase.entranceNumber != null;
}

/**
 * Finestra di validità abbonamento: [dataAcquisto, dataAcquisto + durata giorni).
 * Usa solo lo snapshot `duration` sull'Acquisto.
 */
export function membershipCoversAt(
	purchase: Pick<PurchaseAccessSnapshot, "date" | "duration">,
	at: Date
): boolean {
	if (purchase.duration == null) return false;
	const start = purchase.date.getTime();
	const end = start + purchase.duration * 24 * 60 * 60 * 1000;
	const t = at.getTime();
	return t >= start && t < end;
}

/** Snapshot da specializzazione Prodotto corrente (solo al momento della vendita). */
export function snapshotFromProduct(product: {
	membership: { duration: number } | null;
	entranceSet: { entranceNumber: number } | null;
}): { duration: number | null; entranceNumber: number | null } {
	if (product.membership) {
		return { duration: product.membership.duration, entranceNumber: null };
	}
	if (product.entranceSet) {
		return { duration: null, entranceNumber: product.entranceSet.entranceNumber };
	}
	throw new Error("Il Prodotto non ha specializzazione Abbonamento né Pacchetto ingressi");
}
