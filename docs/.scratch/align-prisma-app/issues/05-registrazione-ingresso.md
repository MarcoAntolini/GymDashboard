# 05 — Registrazione Ingresso (transazione + tie-break)

**What to build:** L’operatore registra un Ingresso scegliendo solo il Cliente (e data opzionale). Il sistema, in una singola transazione DB, collega l’Ingresso all’Acquisto giusto: preferenza Abbonamento valido più recente; altrimenti Pacchetto con residuo > 0 in FIFO; se nessuno, errore di dominio. La UI non manda `clientId` a Prisma create; tabella e CRUD usano `id` e mostrano Acquisto/Prodotto (Cliente via Acquisto).

**Blocked by:**

- 01 — Migrate + reset DB al nuovo schema Prisma
- 04 — Acquisti: PK surrogata, snapshot importo, niente tipo

**Status:** ready-for-agent

- [ ] `registerEntrance(clientId, date?)` (o equivalente) implementa l’algoritmo di `03-schema-logico.md` in `$transaction` — nessuna invenzione di regole nuove
- [ ] Tie-break: Abbonamento con `date ∈ [acquisto.date, acquisto.date + duration)` → max `(date, id)`; altrimenti Pacchetto con `residuo = entranceNumber − COUNT(ingressi)` > 0 → min `(date, id)`
- [ ] Nessun candidato → errore di dominio chiaro in UI
- [ ] Get/edit/delete Ingresso per `id`; list include purchase → client + prodotto
- [ ] Form Ingressi: pick Cliente; non richiede `purchaseId` (niente override admin in questo ticket)
- [ ] Almeno casi sequenziali verificabili: membership preferred, FIFO pacchetto, reject a residuo 0 (TDD consigliato)

## Notes (agent)

- Pure helper `selectJustifyingPurchaseId` in `src/lib/entrance-justification.ts` (half-open membership window; residuo = N − COUNT; max/min `(date, id)` tie-break exactly as regola 9).
- `registerEntrance` / `createEntrance` run interactive `$transaction` with `RepeatableRead` + `SELECT … FOR UPDATE` on the Cliente’s Acquisti to mitigate concurrent Pacchetto residual races; insert uses chosen `purchaseId` only (no `clientId` on Ingresso).
- Domain error: `NO_JUSTIFYING_PURCHASE_ERROR` toasted on create failure; dialog stays open (rethrow).
- CRUD by surrogate `id`; list includes `purchase.client` + `purchase.prodotto` (membership/entranceSet); form Select Cliente only.
- `mockEntrances` attaches to existing Acquisti (skips if none); residual-aware enough for packages — full seed orchestration left to ticket 07.
- No project test runner — verified sequential cases with `npx tsx scripts/verify-entrance-justification.ts` (membership preferred, max membership, FIFO package, reject residuo 0, half-open window, same-date min id).
- Entrances-area `tsc` clean; did not revert other tickets’ work.
