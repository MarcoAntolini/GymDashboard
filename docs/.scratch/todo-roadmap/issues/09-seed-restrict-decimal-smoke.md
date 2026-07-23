# 09 — Seed ordinato + Restrict/Decimal smoke

**What to build:** Il seed produce dati coerenti col modello: Prodotti/specializzazioni/Listino → Clienti → Acquisti → Ingressi legati a purchaseId reali. Smoke: Acquisto → Ingresso → secondo Ingresso su Pacchetto a residuo 1 fallisce. Restrict e Decimal coerenti.

**Blocked by:** 03 — Clienti senza ingressi rimanenti persistiti; 04 — Listino senza tipo, chiave composta, Decimal; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso (transazione + tie-break)

**Status:** ready-for-agent

- [ ] Orchestrazione seed: Acquisti prima degli Ingressi; Ingressi solo con purchaseId valido
- [ ] Smoke: Acquisto → Ingresso ok; residuo esaurito → reject
- [ ] Delete Prodotto/Acquisto/Cliente con dipendenti → errori Restrict utente-facing
- [ ] Form/display denaro non rompono con Decimal Prisma
- [ ] App smoke base verde sul percorso critico

**Source:** `docs/.scratch/align-prisma-app/issues/07-seed-restrict-decimal-smoke.md`

**Note:** mock realistici IT + Owner sono il ticket 48.
