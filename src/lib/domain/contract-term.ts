/**
 * Domain: Contratto a tempo determinato vs indeterminato.
 * indeterminato (OpenEnded): DataFine assente; determinato (FixedTerm): DataFine valorizzata e ≥ DataInizio.
 * @see docs/domain/02-schema-er.md §7
 */

import { ContractType } from "@prisma/client";

export const CONTRACT_ENDING_DATE_REQUIRED_ERROR =
	"Il Contratto a tempo determinato richiede una data di fine.";

export const CONTRACT_ENDING_DATE_BEFORE_START_ERROR =
	"La data di fine deve essere successiva o uguale alla data di inizio.";

export const CONTRACT_ENDING_DATE_FORBIDDEN_ERROR =
	"Il Contratto a tempo indeterminato non può avere una data di fine.";

export const CONTRACT_IN_PROGRESS_LABEL = "In corso";

/** True when type is tempo indeterminato (no end date). */
export function isOpenEndedContract(type: ContractType): boolean {
	return type === ContractType.OpenEnded;
}

/** True when type is tempo determinato (end date required). */
export function isFixedTermContract(type: ContractType): boolean {
	return type === ContractType.FixedTerm;
}

/**
 * Normalize endingDate for persist: OpenEnded → null; FixedTerm keeps the date (or null if missing).
 */
export function normalizeContractEndingDate(
	type: ContractType,
	endingDate: Date | null | undefined
): Date | null {
	if (isOpenEndedContract(type)) {
		return null;
	}
	return endingDate ?? null;
}

/**
 * Assert domain rule type ↔ endingDate. Throws Error with Italian message on violation.
 */
export function assertContractEndingDate(
	type: ContractType,
	startingDate: Date,
	endingDate: Date | null | undefined
): void {
	if (isOpenEndedContract(type)) {
		if (endingDate != null) {
			throw new Error(CONTRACT_ENDING_DATE_FORBIDDEN_ERROR);
		}
		return;
	}

	if (endingDate == null) {
		throw new Error(CONTRACT_ENDING_DATE_REQUIRED_ERROR);
	}
	if (endingDate.getTime() < startingDate.getTime()) {
		throw new Error(CONTRACT_ENDING_DATE_BEFORE_START_ERROR);
	}
}

/**
 * List/detail label for endingDate: OpenEnded (or null) → "In corso"; FixedTerm → locale date.
 */
export function formatContractEndingDateDisplay(
	type: ContractType,
	endingDate: Date | null | undefined,
	locale = "it-IT"
): string {
	if (isOpenEndedContract(type) || endingDate == null) {
		return CONTRACT_IN_PROGRESS_LABEL;
	}
	return new Date(endingDate).toLocaleDateString(locale);
}
