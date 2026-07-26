# 28 — Liste server-side: Account

**What to build:** La lista Account usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Account non filtra più l'intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listAccounts` in `src/data-access/accounts.ts` (allowlist sort/filter; username contains; role/approved exact; ORDER BY + tie-break `username`).
- Config `src/lib/list/accounts.ts` (sort: employeeId/username; filter: username/role/approved).
- Pagina `/accounts` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra** (niente più faceted client-side su role/approved).
- CRUD: create/delete → `refetch`; edit / coda approvazione → update ottimistico su pagina corrente; username create via `getAccount` (non più scan pagina).
- Smoke DB: `npx tsx scripts/smoke-list-accounts.ts` (paginazione, filtri, allowlist sort, role/approved).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllAccounts` tenuto per consumer non-lista.
