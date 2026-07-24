/**
 * Intervalli Contratto half-open [startingDate, endingDate)
 * (endingDate null = +∞). Vedi docs/domain/02-schema-er.md §7.
 */

export type ContractInterval = {
	startingDate: Date;
	endingDate: Date | null;
};

export const OVERLAPPING_CONTRACT_ERROR =
	"Il contratto si sovrappone a un altro contratto dello stesso dipendente.";

/**
 * True se gli intervalli half-open si intersecano.
 * Contatto sul bordo (adiacenti) → false.
 */
export function contractIntervalsOverlap(a: ContractInterval, b: ContractInterval): boolean {
	const aEnd = a.endingDate?.getTime() ?? Number.POSITIVE_INFINITY;
	const bEnd = b.endingDate?.getTime() ?? Number.POSITIVE_INFINITY;
	return a.startingDate.getTime() < bEnd && b.startingDate.getTime() < aEnd;
}
