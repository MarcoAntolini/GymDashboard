# 35 — Liste server-side: Pagamenti

**What to build:** La lista Pagamenti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Pagamenti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-24T00:03:00Z — claimed by implement loop (cloud)

## Done

- Domain `payment-list-query`: filter `type` (exact enum key or IT label: Stipendio/Bolletta/Attrezzatura/Intervento), sort id/date/amount/type, default `id` asc; tests for WHERE + contract.
- DA `listPayments` via `runListQuery` + `emptyKind` / `totalUnfiltered` (keeps relation include + amount string); `getAllPayments` retained for non-list callers.
- Page `/payments` uses `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refresh via `fetchList`.
- Empty states: dataset vs filters (`Nessun pagamento registrato.`).
