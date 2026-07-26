# 26 — Liste server-side: Listino

**What to build:** La lista Listino usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Listino non filtra più l'intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listCatalogs` in `src/data-access/catalogs.ts` (allowlist sort/filter su `year`/`productCode`/`price`; `kind` escluso; ORDER BY + tie-break PK composta).
- Pagina `/catalogs` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra** (year exact int; niente più faceted client-side).
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-catalogs.ts` (paginazione, filtri, allowlist sort, strip `kind`, sort price).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllCatalogs` tenuto per consumer non-lista.
