# 06 — Contratti senza intervalli sovrapposti

**What to build:** L’operatore non può creare o aggiornare un Contratto il cui intervallo `[startingDate, endingDate)` si sovrappone a un altro Contratto dello stesso Dipendente (`endingDate` null = infinito). La violazione viene rifiutata prima del persist, con messaggio chiaro.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** ready-for-agent

- [ ] Create Contratto con overlap sullo stesso Dipendente → reject
- [ ] Update Contratto che introdurrebbe overlap → reject
- [ ] Intervallo aperto (`endingDate` null) trattato come +∞ secondo la regola in `02-schema-er.md` §7
- [ ] Contratti non sovrapposti (adiacenti ok se la regola di half-open lo consente) vengono salvati

## Notes (agent)

- Pure helper `contractIntervalsOverlap` in `src/lib/contract-intervals.ts` (half-open `[start, end)`; null end = +∞). Adjacent boundary touch → no overlap.
- `createContract` / `editContract` call `assertNoOverlappingContract` before Prisma persist; update excludes the row’s own `(employeeId, startingDate)`.
- Clear `Error` message; contracts page toasts on create/edit failure and rethrows so dialogs stay open.
- No project test runner — verified helper cases with `tsx` (overlap, open-ended, adjacent OK).
- Did not change other tickets’ areas (clients/catalogs/purchases/entrances).
