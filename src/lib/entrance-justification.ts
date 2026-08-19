/**
 * Scelta della Vendita giustificatrice per un Ingresso (regola 9 / 03-schema-logico.md).
 * Usa solo snapshot su Vendita (durata / N) + COUNT ingressi già collegati.
 */

import {
	isEntranceSetSale,
	isMembershipSale,
	membershipCoversAt,
	packageResidual,
	type SaleAccessSnapshot,
} from "@/lib/domain/sale-access";

export const NO_JUSTIFYING_SALE_ERROR =
	"Nessuna vendita giustifica l'ingresso: abbonamento non valido o pacchetto esaurito.";

export type JustifyingSaleCandidate = SaleAccessSnapshot & {
	id: number;
	/** COUNT(ingressi) già collegati a questa Vendita (nella stessa transazione). */
	entrancesLinked: number;
};

function compareDateIdMax(
	a: Pick<JustifyingSaleCandidate, "date" | "id">,
	b: Pick<JustifyingSaleCandidate, "date" | "id">
): number {
	const byDate = a.date.getTime() - b.date.getTime();
	if (byDate !== 0) return byDate;
	return a.id - b.id;
}

/**
 * Restituisce l'id della Vendita giustificatrice per `at`, oppure lancia NO_JUSTIFYING_SALE_ERROR.
 *
 * 1. Abbonamenti validi in `at` → arg max (date, id)
 * 2. Altrimenti pacchetti con residuo > 0 → arg min (date, id) (FIFO)
 * 3. Altrimenti rifiuta
 */
export function selectJustifyingSaleId(
	sales: JustifyingSaleCandidate[],
	at: Date
): number {
	const memberships = sales.filter(
		(p) => isMembershipSale(p) && membershipCoversAt(p, at)
	);
	if (memberships.length > 0) {
		return memberships.reduce((best, p) =>
			compareDateIdMax(p, best) > 0 ? p : best
		).id;
	}

	const packages = sales.filter((p) => {
		if (!isEntranceSetSale(p)) return false;
		const residual = packageResidual(p, p.entrancesLinked);
		return residual != null && residual > 0;
	});
	if (packages.length > 0) {
		return packages.reduce((best, p) =>
			compareDateIdMax(p, best) < 0 ? p : best
		).id;
	}

	throw new Error(NO_JUSTIFYING_SALE_ERROR);
}
