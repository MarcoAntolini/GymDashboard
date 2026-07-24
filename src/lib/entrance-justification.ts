/**
 * Scelta dell'Acquisto giustificatore per un Ingresso (regola 9 / 03-schema-logico.md).
 * Usa solo snapshot su Acquisto (durata / N) + COUNT ingressi già collegati.
 */

import {
	isEntranceSetPurchase,
	isMembershipPurchase,
	membershipCoversAt,
	packageResidual,
	type PurchaseAccessSnapshot,
} from "@/lib/domain/purchase-access";

export const NO_JUSTIFYING_PURCHASE_ERROR =
	"Nessun acquisto giustifica l'ingresso: abbonamento non valido o pacchetto esaurito.";

export type JustifyingPurchaseCandidate = PurchaseAccessSnapshot & {
	id: number;
	/** COUNT(ingressi) già collegati a questo Acquisto (nella stessa transazione). */
	entrancesLinked: number;
};

function compareDateIdMax(
	a: Pick<JustifyingPurchaseCandidate, "date" | "id">,
	b: Pick<JustifyingPurchaseCandidate, "date" | "id">
): number {
	const byDate = a.date.getTime() - b.date.getTime();
	if (byDate !== 0) return byDate;
	return a.id - b.id;
}

/**
 * Restituisce l'id Acquisto giustificatore per `at`, oppure lancia NO_JUSTIFYING_PURCHASE_ERROR.
 *
 * 1. Abbonamenti validi in `at` → arg max (date, id)
 * 2. Altrimenti pacchetti con residuo > 0 → arg min (date, id) (FIFO)
 * 3. Altrimenti rifiuta
 */
export function selectJustifyingPurchaseId(
	purchases: JustifyingPurchaseCandidate[],
	at: Date
): number {
	const memberships = purchases.filter(
		(p) => isMembershipPurchase(p) && membershipCoversAt(p, at)
	);
	if (memberships.length > 0) {
		return memberships.reduce((best, p) =>
			compareDateIdMax(p, best) > 0 ? p : best
		).id;
	}

	const packages = purchases.filter((p) => {
		if (!isEntranceSetPurchase(p)) return false;
		const residual = packageResidual(p, p.entrancesLinked);
		return residual != null && residual > 0;
	});
	if (packages.length > 0) {
		return packages.reduce((best, p) =>
			compareDateIdMax(p, best) < 0 ? p : best
		).id;
	}

	throw new Error(NO_JUSTIFYING_PURCHASE_ERROR);
}
