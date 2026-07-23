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

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Domain `contract-list-query`: filters `employeeId` (exact) + `type` (enum key / IT label); sort columns employeeId/type/hourlyFee/startingDate/endingDate; default employeeId asc.
- DA `listContracts` via `runListQuery` + `emptyKind` / `totalUnfiltered`; `getAllContracts` retained for non-list callers.
- Contratti page wired to `useServerListQuery` + `ServerDataTable` (Filtra/sort/page); create/edit/delete refresh list; earnings sheet unchanged (client DataTable).
- Domain unit tests for WHERE/sort contract.
