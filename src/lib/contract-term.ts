import { formatDateIt } from "@/lib/format";
import { ContractType } from "@prisma/client";

/**
 * Regola Contratto tipo ↔ data fine (docs/domain/02-schema-er.md §7):
 * - Tempo indeterminato (OpenEnded): endingDate assente (null)
 * - Tempo determinato (FixedTerm): endingDate valorizzata e ≥ startingDate
 */

export const FIXED_TERM_ENDING_DATE_REQUIRED =
	"Per un contratto a tempo determinato è obbligatoria la data di fine.";

export const ENDING_DATE_BEFORE_START =
	"La data di fine deve essere successiva o uguale alla data di inizio.";

/** True se il tipo richiede (e mostra) la data di fine. */
export function contractRequiresEndingDate(type: ContractType): boolean {
	return type === ContractType.FixedTerm;
}

/**
 * Normalizza endingDate in base al tipo.
 * OpenEnded → sempre null. FixedTerm → richiede una data ≥ startingDate.
 */
export function resolveContractEndingDate({
	type,
	startingDate,
	endingDate
}: {
	type: ContractType;
	startingDate: Date;
	endingDate?: Date | null;
}): Date | null {
	if (type === ContractType.OpenEnded) {
		return null;
	}
	if (endingDate == null) {
		throw new Error(FIXED_TERM_ENDING_DATE_REQUIRED);
	}
	if (endingDate.getTime() < startingDate.getTime()) {
		throw new Error(ENDING_DATE_BEFORE_START);
	}
	return endingDate;
}

/** Etichetta lista/dettaglio: indeterminato → "In corso", altrimenti data locale. */
export function formatContractEndingDateLabel(
	type: ContractType,
	endingDate: Date | null | undefined
): string {
	if (type === ContractType.OpenEnded || endingDate == null) {
		return "In corso";
	}
	return formatDateIt(endingDate);
}
