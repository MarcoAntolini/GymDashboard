# 23 — Liste server-side: Prodotti

**What to build:** La lista Prodotti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Prodotti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23 — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

## Done

- Domain helpers in `src/lib/domain/product-list-query.ts` (+ tests): WHERE for `code` contains; sort allowlist `code` only (default `code asc`); derived `productKind` not sortable.
- Data-access `listProducts` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllProducts` kept for non-list callers.
- Prodotti page wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page).
- Scope limited to ticket 23 — next candidate: 24 Abbonamenti.
