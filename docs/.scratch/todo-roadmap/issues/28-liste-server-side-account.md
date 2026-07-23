# 28 — Liste server-side: Account

**What to build:** La lista Account usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

## Comments

- 2026-07-23T23:36:00Z — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

- [x] List Account non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Done

- Domain helpers in `src/lib/domain/account-list-query.ts` (+ tests): WHERE contains for `username`; exact `role` (enum key or IT label), `approved` (true/false aliases), `employeeId` (int); sort allowlist `employeeId`/`username` (default `employeeId asc`).
- Data-access `listAccounts` via `runListQuery` + Prisma skip/take/count + `emptyKind` (dataset vs filtri); `getAllAccounts` kept for non-list callers.
- Account page (`/accounts`) wired to `useServerListQuery` + `ServerDataTable` (Filtra/Reset, server sort/page); create/edit/delete/approval refetch the list; username generation uniqueness via `getAccount`; pending badge from `getPendingAccounts`.
- Scope limited to ticket 28 — next candidate: 29 Contratti.
