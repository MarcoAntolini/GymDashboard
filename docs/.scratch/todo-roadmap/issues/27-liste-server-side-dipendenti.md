# 27 — Liste server-side: Dipendenti

**What to build:** La lista Dipendenti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Dipendenti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listEmployees` in `src/data-access/employees.ts` (allowlist sort/filter su anagrafica; city/province come contains; ORDER BY + tie-break `id`).
- Config `src/lib/list/employees.ts` (mirror Clienti, `hiringDate` al posto di `enrollmentDate`).
- Pagina `/employees` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra** (niente più faceted client-side su city/province).
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-employees.ts` (paginazione, filtri, allowlist sort, sample city).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllEmployees` / helper senza account/contratto tenuti per consumer non-lista.
