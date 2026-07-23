# 24 — Liste server-side: Abbonamenti

**What to build:** La lista Abbonamenti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Abbonamenti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23 — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

## Done

- Domain helpers in `src/lib/domain/membership-list-query.ts` (+ tests): WHERE for `productCode` contains + `duration` exact int; sort allowlist `productCode`/`duration` (default `productCode asc`).
- Data-access `listMemberships` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllMemberships` kept for non-list callers.
- Abbonamenti page wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refetch the list.
- Scope limited to ticket 24 — next candidate: 25 Pacchetti ingressi.
