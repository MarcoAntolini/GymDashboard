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

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Pure helper `contractIntervalsOverlap` in `src/lib/domain/contract-intervals.ts` (half-open `[start, end)`; null end = +∞; adjacent touch → no overlap).
- `assertNoOverlappingContract` called from `createContract` / `editContract` before Prisma persist; update excludes own `(employeeId, startingDate)`.
- Clear Italian `CONTRACT_OVERLAP_ERROR`; create/edit UI already toasts via Dashboard / ItemActions and keeps dialogs open.
- Domain tests: `src/lib/domain/contract-intervals.test.ts` (overlap, open-ended, adjacent OK, containment).
- Full DB integration smoke deferred to ticket 09 (seed + Restrict/Decimal).
