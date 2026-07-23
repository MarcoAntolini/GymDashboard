# 06 — Registrazione Ingresso (transazione + tie-break)

**What to build:** L’operatore registra un Ingresso scegliendo solo il Cliente (e data opzionale). Il sistema, in una singola transazione DB, collega l’Ingresso all’Acquisto giusto usando lo snapshot Acquisto: preferenza Abbonamento valido più recente; altrimenti Pacchetto con residuo > 0 in FIFO; se nessuno, errore di dominio.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma; 02 — Snapshot durata e N ingressi su Acquisto; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo

**Status:** resolved

- [x] registerEntrance(clientId, date?) implementa l’algoritmo di dominio in $transaction — nessuna regola inventata
- [x] Tie-break: Abbonamento valido → max (date, id); altrimenti Pacchetto con residuo > 0 → min (date, id)
- [x] Nessun candidato → errore di dominio chiaro in UI
- [x] Get/edit/delete Ingresso per id; list include purchase → client + prodotto
- [x] Form Ingressi: pick Cliente; non richiede purchaseId

**Source:** `docs/.scratch/align-prisma-app/issues/05-registrazione-ingresso.md`

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Pure `selectJustifyingPurchaseId` in `src/lib/domain/entrance-justification.ts` (membership preferred → max `(date,id)`; else pack residual FIFO → min `(date,id)`; half-open membership window via snapshot helpers).
- `registerEntrance` / `createEntrance` run `$transaction` with `RepeatableRead` + `SELECT … FOR UPDATE` on the Cliente’s Acquisti; insert uses chosen `purchaseId` only.
- CRUD by surrogate `id`; list includes `purchase.client` + `purchase.prodotto`; edit re-justifies excluding the row being moved.
- Form Ingressi: Select Cliente (+ date); no `purchaseId`. Domain miss → `NO_JUSTIFYING_PURCHASE_ERROR` toasted; dialog stays open.
- Unit tests + `scripts/verify-entrance-justification.ts`; `mockEntrances` attaches only to justifying `purchaseId`s (residual-aware). Full DB smoke deferred to ticket 09 (no DB in this environment).
