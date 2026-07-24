# 09 — Seed ordinato + Restrict/Decimal smoke

**What to build:** Il seed produce dati coerenti col modello: Prodotti/specializzazioni/Listino → Clienti → Acquisti → Ingressi legati a purchaseId reali. Smoke: Acquisto → Ingresso → secondo Ingresso su Pacchetto a residuo 1 fallisce. Restrict e Decimal coerenti.

**Blocked by:** 03 — Clienti senza ingressi rimanenti persistiti; 04 — Listino senza tipo, chiave composta, Decimal; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso (transazione + tie-break)

**Status:** resolved

- [x] Orchestrazione seed: Acquisti prima degli Ingressi; Ingressi solo con purchaseId valido
- [x] Smoke: Acquisto → Ingresso ok; residuo esaurito → reject
- [x] Delete Prodotto/Acquisto/Cliente con dipendenti → errori Restrict utente-facing
- [x] Form/display denaro non rompono con Decimal Prisma
- [x] App smoke base verde sul percorso critico

**Source:** `docs/.scratch/align-prisma-app/issues/07-seed-restrict-decimal-smoke.md`

**Note:** mock realistici IT + Owner sono il ticket 48.

## Comments

- 2026-07-24 18:34 — claimed by implement loop

## Done

- Seed `mockAll`: ordine Prodotti → Membership/EntranceSet → Listino → Clienti → Acquisti → Ingressi; `mockEntrances` solo su `purchaseId` reali e residuo pacchetto.
- `deleteProduct` mappa P2003/P2014 → messaggio Restrict IT (Cliente/Acquisto già coperti).
- Decimal: write `Prisma.Decimal` su Contratti/Pagamenti; display/form defaults con `Number(...)`; mock contratti/pagamenti in Decimal.
- Smoke: `scripts/smoke-entrance-flow.ts` (ingresso + Restrict) + `verify-entrance-justification` + `smoke-register-entrance` verdi; re-export `NO_JUSTIFYING_PURCHASE_ERROR` da entrances.
- Deferral: mock IT realistici / Owner → ticket 48.
