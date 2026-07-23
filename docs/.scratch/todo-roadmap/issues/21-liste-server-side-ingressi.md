# 21 — Liste server-side: Ingressi

**What to build:** La lista Ingressi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Ingressi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23 — claimed by implement loop (cloud, prior push)

## Done

- Domain helpers `src/lib/domain/entrance-list-query.ts`: WHERE for date range / cliente / prodotto / purchaseId, join-aware ORDER BY, default data desc; unit tests.
- Data-access `listEntrances` via `runListQuery` + Prisma `where`/`orderBy`/`skip`/`take`/`count`, with `totalUnfiltered` + `emptyKind`. `getAllEntrances` kept for other callers.
- UI: Ingressi page uses `useServerListQuery` + `ServerDataTable` (Filtra toolbar, manual TanStack flags, server pagination). Analytics sheets unchanged.
- `ServerDataTable` accepts `datasetEmptyMessage` so Ingressi empty copy is entity-specific.
- Next frontier candidate: **22** — Liste server-side: Acquisti.
