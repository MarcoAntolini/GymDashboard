# 31 — Liste server-side: Stipendi

**What to build:** La lista Stipendi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Stipendi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23T23:50:08Z — claimed by implement loop (cloud)

## Done

- Domain `salary-list-query`: filters `paymentId` / `employeeId` (exact int), sort same columns, default `paymentId` asc; tests for WHERE + contract.
- DA `listSalaries` via `runListQuery` + `emptyKind` / `totalUnfiltered`; `getAllSalaries` retained for non-list callers.
- Page `/salaries` uses `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); edit/delete refresh via `fetchList`.
- Empty states: dataset vs filters (`Nessuno stipendio registrato.`).
