/**
 * Toolbar / empty-state guidance when create is not local to the page
 * (ticket 37 — specializzazioni Pagamento, Prodotti via Abbonamento/Pacchetto).
 */

export const CREATE_VIA_PAGAMENTI =
	"Per registrare una nuova uscita tipizzata, usa Nuovo in Movimenti → Pagamenti (scegli Stipendio, Bolletta, Attrezzatura o Intervento).";

export const CREATE_VIA_PRODOTTO_SPECIALIZZAZIONE =
	"I Prodotti si creano insieme alla specializzazione: usa Nuovo in Abbonamenti o in Pacchetti ingressi.";

export const CREATE_GUIDANCE = {
	stipendi: CREATE_VIA_PAGAMENTI,
	bollette: CREATE_VIA_PAGAMENTI,
	attrezzatura: CREATE_VIA_PAGAMENTI,
	interventi: CREATE_VIA_PAGAMENTI,
	prodotti: CREATE_VIA_PRODOTTO_SPECIALIZZAZIONE,
} as const;
