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

- 2026-07-24 — claimed by implement loop

## Done

- Aggiunto `listClients` in `src/data-access/clients.ts` (allowlist sort/filter, `normalizeListQuery` + `count`/`findMany` + tie-break `id`).
- Pagina `/clients` migrata a `useServerList` + `DataTable` `serverList`; filtri testo (anche city/province) solo su **Filtra**; faceted client-side rimossi in mode server.
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-clients.ts` (paginazione, filtri, allowlist sort).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39 (shell ancora `"No results."`); `getAllClients` tenuto per dropdown Ingressi.
