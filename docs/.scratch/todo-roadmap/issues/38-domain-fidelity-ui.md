# 38 — Domain fidelity visible in the UI

**What to build:** L’operatore vede le regole di dominio su Ingressi, Acquisti, Pagamenti e Listino: Ingresso giustificato da Acquisto; residuo per Acquisto; Pagamenti tipizzati; snapshot Listino/Acquisto; Restrict comprensibile.

**Blocked by:** 37 — CRUD: Dialog create / Sheet edit + feedback; 02 — Snapshot durata e N ingressi su Acquisto; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso

**Status:** resolved

- [x] Registrazione Ingresso rispetta giustificazione via Acquisto; fallimenti chiari
- [x] Nessuna UI con ingressi rimanenti persistiti sul Cliente
- [x] Pagamenti: specializzazione ispezionabile
- [x] Listino/Acquisto: anno e snapshot comprensibili
- [x] Delete Restrict spiega il blocco

**Source:** `docs/.scratch/dashboard-data-ux/issues/06-domain-fidelity-ui.md`

## Comments

- 2026-07-24 — claimed by implement loop (cloud)

## Done

- Ingressi: helper di giustificazione in create/edit; colonna «Acquisto giustificante» con prodotto/tipo; copy IT; toast di fallimento già IT (`NO_JUSTIFYING_PURCHASE_ERROR`).
- Cliente: nessun residuo persistito (invariato); Residuo solo su Acquisto con copy snapshot/derivata.
- Pagamenti: colonna Dettaglio + Sheet specializzazione; label IT tipo/specialty; helper `payment-specialty.ts`.
- Listino/Acquisto: hint anno Listino → importo snapshot (`CatalogAmountDefault` + create copy); edit Acquisto spiega snapshot.
- Restrict: confirm/toast già su Cliente/Acquisto/Prodotto; Listino delete note chiarisce assenza FK Restrict→Acquisto.
- Critique Impeccable dual-agent; P0/P1 fedeltà risolti; deferred: preview pre-submit Acquisto, select Cliente su create Acquisto.
