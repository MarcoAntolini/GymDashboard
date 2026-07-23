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

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Seed order in `mockAll`: Prodotti → specializzazioni → Listino → Clienti → Acquisti → Ingressi (then HR/ops); `mockEntrances` already attaches only via justifying `purchaseId`.
- `deleteProduct` maps FK Restrict to `PRODUCT_HAS_PURCHASES_MESSAGE`; Cliente/Acquisto messages already in place.
- Decimal hardening: payments/contracts data-access serialize money as 2-decimal strings and write `Prisma.Decimal`; mocks use Decimal; UI forms use decimal strings.
- Smoke: `scripts/smoke-entrance-flow.ts` — Pacchetto residuo 1 → Ingresso OK, second reject, Restrict deletes, Decimal format OK; plus unit tests + `verify-entrance-justification`.
- Deferral: Italian mock realism / Owner seed remains ticket 48.
