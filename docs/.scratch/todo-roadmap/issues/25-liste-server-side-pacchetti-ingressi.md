# 25 — Liste server-side: Pacchetti ingressi

**What to build:** La lista Pacchetti ingressi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

## Comments

- 2026-07-23T23:24:33Z — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

- [x] List Pacchetti ingressi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Done

- Domain helpers in `src/lib/domain/entrance-set-list-query.ts` (+ tests): WHERE for `productCode` contains + `entranceNumber` exact int; sort allowlist `productCode`/`entranceNumber` (default `productCode asc`).
- Data-access `listEntranceSets` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllEntranceSets` kept for non-list callers.
- Pacchetti ingressi page wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refetch the list.
- Scope limited to ticket 25 — next candidate: 26 Listino.
