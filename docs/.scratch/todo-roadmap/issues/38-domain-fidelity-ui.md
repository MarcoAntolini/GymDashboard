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

- 2026-07-28 — claimed by implement loop

## Done

- Ingressi: Dialog create spiega giustificazione automatica (Abbonamento → Pacchetto FIFO); edit Sheet mostra Acquisto bloccato + copy di dominio; toast già usa `NO_JUSTIFYING_PURCHASE_ERROR`.
- Cliente: confermato nessun campo “ingressi rimanenti” in UI (solo guardrail allowlist).
- Pagamenti: `listPayments` include specializzazioni; colonna Dettaglio + dettaglio tipizzato nello Sheet edit.
- Acquisti/Listino: copy snapshot + hint “prezzo da Listino {anno}”; etichette IT su edit Listino; Importo (snapshot) in create.
- Restrict: helper `throwIfRestrictViolation` + messaggi “vincolo Restrict” su Cliente/Prodotto/Acquisto (toast + delete confirm).
- Deferral: Italianizzazione completa form EN rimanenti → ticket 47; residuo pacchetto in lista Acquisti (opzionale per `04-viste-colonne`) → non in scope.
