# 27 — Liste server-side: Dipendenti

**What to build:** La lista Dipendenti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

## Comments

- 2026-07-23T23:31:00Z — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

- [x] List Dipendenti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Done

- Domain helpers in `src/lib/domain/employee-list-query.ts` (+ tests): WHERE contains for `taxCode`/`name`/`surname`/`city`/`province`; sort allowlist `id`/`taxCode`/`name`/`surname`/`birthDate`/`city`/`province`/`hiringDate` (default `surname asc`).
- Data-access `listEmployees` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllEmployees` kept for non-list callers.
- Dipendenti page (`/employees`) wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete refetch the list.
- Scope limited to ticket 27 — next candidate: 28 Account.
