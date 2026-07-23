# 07 — Seed ordinato + Restrict/Decimal smoke

**What to build:** Il seed produce dati coerenti col modello: Prodotti/specializzazioni/Listino → Clienti → Acquisti → Ingressi legati a `purchaseId` reali. Uno smoke manuale (o test) dimostra: crea Acquisto → registra Ingresso → secondo Ingresso su Pacchetto a residuo 1 fallisce. Delete Restrict su Prodotto/Acquisto/Cliente e form denaro Decimal sono coerenti dove toccati.

**Blocked by:**

- 02 — Clienti senza ingressi rimanenti persistiti
- 03 — Listino senza tipo, chiave composta, Decimal
- 04 — Acquisti: PK surrogata, snapshot importo, niente tipo
- 05 — Registrazione Ingresso (transazione + tie-break)

**Status:** ready-for-agent

- [ ] Orchestrazione seed: Acquisti prima degli Ingressi; Ingressi solo con `purchaseId` valido (niente mock basato solo su `clientId`)
- [ ] Smoke: Acquisto → Ingresso ok; residuo esaurito → reject
- [ ] Delete Prodotto con Acquisti / Acquisto con Ingressi / Cliente con Acquisti → errori Restrict utente-facing
- [ ] Form/display denaro (Acquisti, Listino, Contratti/Pagamenti toccati) non rompono con `Decimal` Prisma
- [ ] App smoke base verde sul percorso critico (tsc o avvio + flusso ingresso)

## Notes

Seed order in `src/lib/mockAll.ts`: products → memberships → entranceSets → catalogs → clients → purchases → entrances → (HR/ops). `mockEntrances` attaches only to real `purchaseId`s and respects Pacchetto residuo.

Smoke (2026-07-21), from `gym-dashboard/`:

1. `npx tsx --env-file=.env scripts/verify-entrance-justification.ts` — unit tie-break cases OK
2. `npx tsx --env-file=.env scripts/smoke-entrance-flow.ts` — DB: Acquisto Pacchetto residuo 1 → Ingresso OK; second Ingresso reject; Restrict on Acquisto/Prodotto/Cliente (user-facing messages); cleanup OK
3. `npx tsc --noEmit` — clean

Gaps filled: `deleteProduct` Restrict message (Cliente/Acquisto already done in 02/04). Decimal hardening on payments/contracts display + form defaults + write `Prisma.Decimal`.
