import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CREATE_GUIDANCE,
	CREATE_VIA_PAGAMENTI,
	CREATE_VIA_PRODOTTO_SPECIALIZZAZIONE,
} from "./create-guidance";

describe("CREATE_GUIDANCE", () => {
	it("points Pagamento specializations to Pagamenti", () => {
		assert.equal(CREATE_GUIDANCE.stipendi, CREATE_VIA_PAGAMENTI);
		assert.equal(CREATE_GUIDANCE.bollette, CREATE_VIA_PAGAMENTI);
		assert.equal(CREATE_GUIDANCE.attrezzatura, CREATE_VIA_PAGAMENTI);
		assert.equal(CREATE_GUIDANCE.interventi, CREATE_VIA_PAGAMENTI);
		assert.match(CREATE_VIA_PAGAMENTI, /Pagamenti/);
	});

	it("points Prodotti to Abbonamenti / Pacchetti ingressi", () => {
		assert.equal(CREATE_GUIDANCE.prodotti, CREATE_VIA_PRODOTTO_SPECIALIZZAZIONE);
		assert.match(CREATE_VIA_PRODOTTO_SPECIALIZZAZIONE, /Abbonamenti/);
	});
});
