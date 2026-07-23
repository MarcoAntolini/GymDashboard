# 32 — Liste server-side: Bollette

**What to build:** La lista Bollette usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Bollette non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23T23:53:00Z — claimed by implement loop (cloud)

## Done

- Domain `bill-list-query`: filters `paymentId` (exact int) / `provider` (contains), sort paymentId/description/provider, default `paymentId` asc; tests for WHERE + contract.
- DA `listBills` via `runListQuery` + `emptyKind` / `totalUnfiltered`; `getAllBills` retained for non-list callers.
- Page `/bills` uses `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); edit/delete refresh via `fetchList`.
- Empty states: dataset vs filters (`Nessuna bolletta registrata.`).
