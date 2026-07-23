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

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Domain `clocking-list-query`: filter `employeeId` (exact int), sort `employeeId` / `entranceTime` / `exitTime`, default `entranceTime` desc; tests for WHERE + contract.
- DA `listClockings` via `runListQuery` + `emptyKind` / `totalUnfiltered`; `getAllClockings` retained for non-list callers.
- Page `/clockings` uses `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refresh via `fetchList`.
- Empty states: dataset vs filters (`Nessuna timbratura registrata.`).
