/**
 * Regole di accesso basate sullo snapshot Vendita (durata / N ingressi alla vendita).
 * Non leggere mai Membership.duration / EntranceSet.entranceNumber per giustificare Ingressi.
 */

export type SaleAccessSnapshot = {
	date: Date;
	duration: number | null;
	entranceNumber: number | null;
};

/** Residuo pacchetto: snapshot N − ingressi già collegati. */
export function packageResidual(
	sale: Pick<SaleAccessSnapshot, "entranceNumber">,
	entrancesLinked: number
): number | null {
	if (sale.entranceNumber == null) return null;
	return sale.entranceNumber - entrancesLinked;
}

/** True se la Vendita è un Abbonamento (ha durata snapshot). */
export function isMembershipSale(
	sale: Pick<SaleAccessSnapshot, "duration" | "entranceNumber">
): boolean {
	return sale.duration != null;
}

/** True se la Vendita è un Pacchetto (ha N ingressi snapshot). */
export function isEntranceSetSale(
	sale: Pick<SaleAccessSnapshot, "duration" | "entranceNumber">
): boolean {
	return sale.entranceNumber != null;
}

/**
 * Finestra di validità abbonamento: [dataVendita, dataVendita + durata giorni).
 * Usa solo lo snapshot `duration` sulla Vendita.
 */
export function membershipCoversAt(
	sale: Pick<SaleAccessSnapshot, "date" | "duration">,
	at: Date
): boolean {
	if (sale.duration == null) return false;
	const start = sale.date.getTime();
	const end = start + sale.duration * 24 * 60 * 60 * 1000;
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
