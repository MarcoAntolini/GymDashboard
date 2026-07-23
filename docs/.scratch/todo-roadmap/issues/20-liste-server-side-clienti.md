# 20 — Liste server-side: Clienti

**What to build:** La lista Clienti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Clienti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-23 23:02 UTC — claimed by implement loop (cloud)

## Done

- Domain helpers `src/lib/domain/client-list-query.ts`: WHERE contains for CF/nome/cognome/città/provincia, sort allowlist, default ORDER BY cognome asc; unit tests.
- Data-access `listClients` via `runListQuery` + Prisma `where`/`orderBy`/`skip`/`take`/`count`, with `totalUnfiltered` + `emptyKind` (dataset vs filters). `getAllClients` kept for other callers.
- UI: Clienti page uses `useServerListQuery` + reusable `ServerDataTable` (Filtra toolbar, manual TanStack flags, server pagination). Keystrokes stay draft-only until Filtra.
- Next frontier candidate: **21** — Liste server-side: Ingressi.
