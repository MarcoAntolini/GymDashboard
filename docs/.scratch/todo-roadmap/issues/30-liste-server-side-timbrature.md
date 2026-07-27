# 30 — Liste server-side: Timbrature

**What to build:** La lista Timbrature usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Timbrature non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-27 — claimed by implement loop

## Done

- Aggiunto `listClockings` in `src/data-access/clockings.ts` (allowlist sort/filter; `employeeId` exact; ORDER BY + tie-break PK `employeeId`/`entranceTime`).
- Config `src/lib/list/clockings.ts` (sort: employeeId/entranceTime/exitTime; filter: employeeId; default `entranceTime` desc).
- Pagina `/clockings` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-clockings.ts` (paginazione, filtri, allowlist sort, employeeId).
- Commit: `a7d6bed` — `feat(timbrature): lista server-side Filtra/sort/paginazione (ticket 30)`.
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllClockings` tenuto per consumer non-lista.
