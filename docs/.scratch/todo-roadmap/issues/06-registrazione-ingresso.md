# 06 — Registrazione Ingresso (transazione + tie-break)

**What to build:** L’operatore registra un Ingresso scegliendo solo il Cliente (e data opzionale). Il sistema, in una singola transazione DB, collega l’Ingresso all’Acquisto giusto usando lo snapshot Acquisto: preferenza Abbonamento valido più recente; altrimenti Pacchetto con residuo > 0 in FIFO; se nessuno, errore di dominio.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma; 02 — Snapshot durata e N ingressi su Acquisto; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo

**Status:** claimed

- [ ] registerEntrance(clientId, date?) implementa l’algoritmo di dominio in $transaction — nessuna regola inventata
- [ ] Tie-break: Abbonamento valido → max (date, id); altrimenti Pacchetto con residuo > 0 → min (date, id)
- [ ] Nessun candidato → errore di dominio chiaro in UI
- [ ] Get/edit/delete Ingresso per id; list include purchase → client + prodotto
- [ ] Form Ingressi: pick Cliente; non richiede purchaseId

**Source:** `docs/.scratch/align-prisma-app/issues/05-registrazione-ingresso.md`

## Comments

- 2026-07-23 — claimed by implement loop (cloud)
