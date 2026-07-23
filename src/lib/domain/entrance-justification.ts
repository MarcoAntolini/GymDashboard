/**
 * Domain: which Acquisto justifies a new Ingresso for a Cliente at a given time.
 * Preferenza: Abbonamento valido più recente; altrimenti Pacchetto con residuo > 0 in FIFO.
 * Tie-break: max (date, id) / min (date, id) — no invented rules.
 */

import {
	canJustifyEntranceAt,
	type PurchaseSnapshot,
} from "./purchase-snapshot";

export const NO_JUSTIFYING_PURCHASE_ERROR =
	"Nessun Acquisto giustifica questo Ingresso: serve un Abbonamento valido o un Pacchetto con residuo.";

export type PurchaseCandidate = PurchaseSnapshot & {
	id: number;
	usedEntranceCount: number;
};

function compareDateId(
	a: { date: Date; id: number },
	b: { date: Date; id: number }
): number {
	const byDate = a.date.getTime() - b.date.getTime();
	if (byDate !== 0) return byDate;
	return a.id - b.id;
}

/**
 * Pure selection of the justifying Acquisto id, or null if none.
 * Memberships win over packs; among memberships max (date, id); among packs min (date, id).
 */
export function selectJustifyingPurchaseId(
	purchases: PurchaseCandidate[],
	at: Date
): number | null {
	const validMemberships = purchases.filter(
		(p) =>
			p.duration != null &&
			canJustifyEntranceAt(p, at, p.usedEntranceCount)
	);
	if (validMemberships.length > 0) {
		validMemberships.sort(compareDateId);
		return validMemberships[validMemberships.length - 1]!.id;
	}

	const packsWithResidual = purchases.filter(
		(p) =>
			p.entranceNumber != null &&
			canJustifyEntranceAt(p, at, p.usedEntranceCount)
	);
	if (packsWithResidual.length > 0) {
		packsWithResidual.sort(compareDateId);
		return packsWithResidual[0]!.id;
	}

	return null;
}
