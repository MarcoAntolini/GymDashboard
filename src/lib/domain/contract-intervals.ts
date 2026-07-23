/**
 * Domain: Contratti non sovrapposti per Dipendente.
 * Intervalli half-open [startingDate, endingDate); endingDate null = +∞.
 * @see docs/domain/02-schema-er.md §7
 */

export const CONTRACT_OVERLAP_ERROR =
	"Il Contratto si sovrappone a un altro Contratto dello stesso Dipendente.";

export type ContractInterval = {
	startingDate: Date;
	endingDate: Date | null;
};

/** True if two half-open intervals intersect. Adjacent boundary touch → false. */
export function contractIntervalsOverlap(
	a: ContractInterval,
	b: ContractInterval
): boolean {
	const aStart = a.startingDate.getTime();
	const bStart = b.startingDate.getTime();
	const aEnd = a.endingDate == null ? Number.POSITIVE_INFINITY : a.endingDate.getTime();
	const bEnd = b.endingDate == null ? Number.POSITIVE_INFINITY : b.endingDate.getTime();
	return aStart < bEnd && bStart < aEnd;
}
