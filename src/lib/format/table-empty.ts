/**
 * Shared empty-state copy for entity tables (ticket 36).
 * Distinguishes dataset vs filters and suggests a next action.
 */

import type { ListEmptyKind } from "@/lib/domain/list-query";

export const FILTERS_EMPTY_MESSAGE =
	"Nessun risultato per i filtri applicati. Modifica o resetta i filtri, poi premi Filtra.";

export const GENERIC_EMPTY_MESSAGE = "Nessun risultato.";

/** Dataset-empty messages with a plausible next action for core entities. */
export const DATASET_EMPTY_MESSAGES = {
	clienti:
		"Nessun Cliente in anagrafica. Usa Nuovo per registrare il primo Cliente.",
	ingressi:
		"Nessun Ingresso registrato. Usa Nuovo per registrare un Ingresso.",
	acquisti:
		"Nessun Acquisto registrato. Usa Nuovo per registrare un Acquisto.",
	prodotti:
		"Nessun Prodotto registrato. Usa Nuovo per aggiungere un Prodotto.",
	listino:
		"Nessuna voce di Listino. Usa Nuovo per impostare un prezzo annuale.",
	contratti:
		"Nessun Contratto registrato. Usa Nuovo per creare un Contratto.",
	pagamenti:
		"Nessun Pagamento registrato. Usa Nuovo per registrare un'uscita.",
} as const;

export type DatasetEmptyEntity = keyof typeof DATASET_EMPTY_MESSAGES;

export function tableEmptyMessage(
	kind: ListEmptyKind | null | undefined,
	datasetEmptyMessage: string
): string {
	if (kind === "filters") return FILTERS_EMPTY_MESSAGE;
	if (kind === "dataset") return datasetEmptyMessage;
	return GENERIC_EMPTY_MESSAGE;
}
