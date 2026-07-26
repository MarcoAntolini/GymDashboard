# 29 — Liste server-side: Contratti

**What to build:** La lista Contratti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Contratti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listContracts` in `src/data-access/contracts.ts` (allowlist sort/filter; `employeeId` exact; `type` exact enum; ORDER BY + tie-break PK `employeeId`/`startingDate`).
- Config `src/lib/list/contracts.ts` (sort: employeeId/type/hourlyFee/startingDate/endingDate; filter: employeeId/type).
- Pagina `/contracts` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra** (niente più faceted client-side su `type`).
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente; earnings sheet e create-dialog invariati.
- Smoke DB: `npx tsx scripts/smoke-list-contracts.ts` (paginazione, filtri, allowlist sort, type/employeeId).
- Commit: `14f9af3` — `feat(contratti): lista server-side Filtra/sort/paginazione (ticket 29)`.
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllContracts` tenuto per consumer non-lista.
