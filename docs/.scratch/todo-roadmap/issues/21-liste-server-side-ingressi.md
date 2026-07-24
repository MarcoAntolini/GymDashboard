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

- 2026-07-24 — claimed by implement loop

## Done

- Aggiunto `listEntrances` in `src/data-access/entrances.ts` (allowlist sort/filter, where su purchaseId/client/product, ORDER BY anche join client/product, tie-break `id`).
- Pagina `/entrances` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**; faceted client-side rimossi in mode server.
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente. Analytics sheets invariati.
- Smoke DB: `npx tsx scripts/smoke-list-entrances.ts` (paginazione, filtri, allowlist sort, sort join).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllEntrances` tenuto per eventuali consumer non-lista.
