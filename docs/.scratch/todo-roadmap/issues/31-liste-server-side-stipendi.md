# 31 — Liste server-side: Stipendi

**What to build:** La lista Stipendi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Stipendi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-27 — claimed by implement loop

## Done

- Aggiunto `listSalaries` in `src/data-access/salaries.ts` (allowlist sort/filter; `paymentId`/`employeeId` exact; ORDER BY + tie-break PK `paymentId`).
- Config `src/lib/list/salaries.ts` (sort: paymentId/employeeId; filter: paymentId/employeeId; default `paymentId` desc).
- Pagina `/salaries` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-salaries.ts` (paginazione, filtri, allowlist sort, paymentId/employeeId).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllSalaries` tenuto per consumer non-lista.
