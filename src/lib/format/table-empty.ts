/**
 * Shared empty / error copy for entity tables (tickets 36, 39).
 * Distinguishes dataset vs filters and suggests a next action.
 */

import type { ListEmptyKind } from "@/lib/domain/list-query";

export const FILTERS_EMPTY_MESSAGE =
	"Nessun risultato per i filtri applicati. Modifica o resetta i filtri, poi premi Filtra.";

export const GENERIC_EMPTY_MESSAGE = "Nessun risultato.";

/** Failed list fetch — actionable recovery cue (ticket 39). */
export const LIST_FETCH_ERROR_MESSAGE =
	"Impossibile caricare l'elenco. Controlla la connessione e riprova.";

export function listFetchErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return LIST_FETCH_ERROR_MESSAGE;
}

/** Dataset-empty messages with a plausible next action for core entities. */
export const DATASET_EMPTY_MESSAGES = {
	clienti:
		"Nessun Cliente in anagrafica. Usa Nuovo per registrare il primo Cliente.",
	ingressi:
		"Nessun Ingresso registrato. Usa Nuovo per registrare un Ingresso.",
	acquisti:
		"Nessun Acquisto registrato. Usa Nuovo per registrare un Acquisto.",
	prodotti:
		"Nessun Prodotto registrato. Crea un Abbonamento o un Pacchetto ingressi per aggiungere un Prodotto.",
	abbonamenti:
		"Nessun Abbonamento registrato. Usa Nuovo per creare un Abbonamento.",
	pacchetti:
		"Nessun Pacchetto ingressi registrato. Usa Nuovo per creare un Pacchetto.",
	listino:
		"Nessuna voce di Listino. Usa Nuovo per impostare un prezzo annuale.",
	dipendenti:
		"Nessun Dipendente in anagrafica. Usa Nuovo per registrare il primo Dipendente.",
	account:
		"Nessun Account registrato. Usa Nuovo per collegare un Account a un Dipendente.",
	contratti:
		"Nessun Contratto registrato. Usa Nuovo per creare un Contratto.",
	timbrature:
		"Nessuna Timbratura registrata. Usa Nuovo per registrare una Timbratura.",
	pagamenti:
		"Nessun Pagamento registrato. Usa Nuovo per registrare un'uscita tipizzata.",
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
