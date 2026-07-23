export type ContractInterval = {
	startingDate: Date;
	endingDate: Date | null | undefined;
};

export function contractIntervalsOverlap(a: ContractInterval, b: ContractInterval): boolean {
	const aEnd = a.endingDate ?? null;
	const bEnd = b.endingDate ?? null;
	const aStartsBeforeBEnds = bEnd === null || a.startingDate < bEnd;
	const bStartsBeforeAEnds = aEnd === null || b.startingDate < aEnd;
	return aStartsBeforeBEnds && bStartsBeforeAEnds;
}
