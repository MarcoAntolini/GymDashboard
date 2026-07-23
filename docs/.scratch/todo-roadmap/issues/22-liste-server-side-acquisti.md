# 22 — Liste server-side: Acquisti

**What to build:** La lista Acquisti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Acquisti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Domain helpers in `src/lib/domain/purchase-list-query.ts` (+ tests): WHERE for date range / clientId / Cliente name+surname / productCode; ORDER BY for nativa/snapshot/join columns; default `date desc`.
- Data-access `listPurchases` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllPurchases` kept for non-list callers.
- Acquisti page wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); derived `remainingEntrances` column is non-sortable.
- Scope limited to ticket 22 — next candidate: 23 Prodotti.
