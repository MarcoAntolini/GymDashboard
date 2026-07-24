import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	DATASET_EMPTY_MESSAGES,
	FILTERS_EMPTY_MESSAGE,
	GENERIC_EMPTY_MESSAGE,
	LIST_FETCH_ERROR_MESSAGE,
	listFetchErrorMessage,
	tableEmptyMessage,
} from "./table-empty";

describe("tableEmptyMessage", () => {
	it("uses dataset message for empty dataset", () => {
		assert.equal(
			tableEmptyMessage("dataset", DATASET_EMPTY_MESSAGES.clienti),
			DATASET_EMPTY_MESSAGES.clienti
		);
	});

	it("uses filters message distinct from dataset", () => {
		assert.equal(
			tableEmptyMessage("filters", DATASET_EMPTY_MESSAGES.ingressi),
			FILTERS_EMPTY_MESSAGE
		);
		assert.notEqual(
			FILTERS_EMPTY_MESSAGE,
			DATASET_EMPTY_MESSAGES.ingressi
		);
	});

	it("falls back to generic when kind unknown", () => {
		assert.equal(tableEmptyMessage(null, DATASET_EMPTY_MESSAGES.acquisti), GENERIC_EMPTY_MESSAGE);
		assert.equal(
			tableEmptyMessage(undefined, DATASET_EMPTY_MESSAGES.acquisti),
			GENERIC_EMPTY_MESSAGE
		);
	});
});

describe("DATASET_EMPTY_MESSAGES", () => {
	it("suggests a next action for core entities", () => {
		for (const message of Object.values(DATASET_EMPTY_MESSAGES)) {
			assert.match(
				message,
				/Usa Nuovo|Crea un|registrare|impostare|usa Nuovo/i
			);
		}
	});
});

describe("LIST_FETCH_ERROR_MESSAGE", () => {
	it("is actionable Italian copy with retry cue", () => {
		assert.match(LIST_FETCH_ERROR_MESSAGE, /caricare|riprova/i);
	});
});

describe("listFetchErrorMessage", () => {
	it("uses Error.message when present", () => {
		assert.equal(
			listFetchErrorMessage(new Error("Connessione interrotta")),
			"Connessione interrotta"
		);
	});

	it("falls back to shared list fetch copy", () => {
		assert.match(listFetchErrorMessage("boom"), /caricare|riprova/i);
		assert.match(listFetchErrorMessage(null), /caricare|riprova/i);
	});
});
