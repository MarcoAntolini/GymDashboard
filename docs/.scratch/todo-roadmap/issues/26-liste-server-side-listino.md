# 26 — Liste server-side: Listino

**What to build:** La lista Listino usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

## Comments

- 2026-07-23T23:28:29Z — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

- [x] List Listino non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Done

- Domain helpers in `src/lib/domain/catalog-list-query.ts` (+ tests): WHERE for `year` exact int + `productCode` contains; sort allowlist `year`/`productCode`/`price` (default `year desc`); derived `productKind` excluded from DB filters/sort.
- Data-access `listCatalogs` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllCatalogs` kept for non-list callers.
- Listino page (`/catalogs`) wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refetch the list; create-dialog tipo filter remains UI-only.
- Scope limited to ticket 26 — next candidate: 27 Dipendenti.
