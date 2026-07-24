# 07 — Contratti senza intervalli sovrapposti

**What to build:** L’operatore non può creare o aggiornare un Contratto il cui intervallo [startingDate, endingDate) si sovrappone a un altro Contratto dello stesso Dipendente (endingDate null = infinito).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

- [x] Create Contratto con overlap sullo stesso Dipendente → reject
- [x] Update Contratto che introdurrebbe overlap → reject
- [x] Intervallo aperto (endingDate null) trattato come +∞
- [x] Contratti adiacenti half-open ammessi vengono salvati

**Source:** `docs/.scratch/align-prisma-app/issues/06-contratti-no-overlap.md`

## Comments
- 2026-07-24 ~18:20 — claimed by implement loop

## Done
- Helper puro `contractIntervalsOverlap` in `src/lib/contract-intervals.ts` (half-open `[start, end)`; null end = +∞; adiacenti OK).
- `assertNoOverlappingContract` chiamato da `createContract` / `editContract` prima del persist; su update esclude la riga `(employeeId, startingDate)`.
- Toast errore + rethrow su create/edit nella pagina Contratti (dialog resta aperto).
- Smoke helper: `npx tsx scripts/smoke-contract-intervals.ts` (overlap, open-ended, adiacenti).
- Nessuna modifica schema DB; vincolo applicativo come da §7 E/R.
