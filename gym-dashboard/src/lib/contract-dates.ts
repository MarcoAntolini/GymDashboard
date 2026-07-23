import { ContractType } from "@prisma/client";

/** Tempo determinato requires an end; tempo indeterminato has none (in corso). */
export function contractRequiresEndingDate(type: ContractType): boolean {
	return type === ContractType.FixedTerm;
}

/**
 * Domain normalization for persistence / submit:
 * - OpenEnded → always null end
 * - FixedTerm → keep provided end (caller/schema must require it)
 */
export function normalizeContractEndingDate(
	type: ContractType,
	endingDate: Date | null | undefined
): Date | null {
	if (type === ContractType.OpenEnded) {
		return null;
	}
	return endingDate ?? null;
}

export type ContractEndingDisplay =
	| { kind: "ongoing"; label: "In corso" }
	| { kind: "date"; label: string }
	| { kind: "missing"; label: "—" };

/** Table / DTO display: OpenEnded is always "In corso", never the raw end date. */
export function contractEndingDisplay(
	type: ContractType,
	endingDate: Date | null | undefined,
	formatDate: (date: Date) => string = (d) => d.toLocaleDateString()
): ContractEndingDisplay {
	if (type === ContractType.OpenEnded) {
		return { kind: "ongoing", label: "In corso" };
	}
	if (endingDate) {
		return { kind: "date", label: formatDate(new Date(endingDate)) };
	}
	return { kind: "missing", label: "—" };
}
