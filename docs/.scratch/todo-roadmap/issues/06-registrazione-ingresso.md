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

- 2026-07-24 — claimed by implement loop

## Done

- Helper puro `selectJustifyingPurchaseId` in `src/lib/entrance-justification.ts` (half-open membership, residuo N−COUNT, max/min `(date,id)`).
- `registerEntrance` in `$transaction` RepeatableRead + `SELECT … FOR UPDATE` su acquisti del Cliente; insert solo con `purchaseId`.
- CRUD Ingresso per `id`; list include `purchase.client` + `purchase.prodotto`.
- UI: Select Cliente + data; toast `NO_JUSTIFYING_PURCHASE_ERROR` su create fallita (dialog resta aperto).
- Verifica: `npx tsx scripts/verify-entrance-justification.ts` + smoke DB `scripts/smoke-register-entrance.ts`.
- Deferral: seed orchestrato / mock realistici → ticket 09/48; override admin purchaseId non in scope.
