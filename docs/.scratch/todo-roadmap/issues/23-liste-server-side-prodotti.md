# 23 ? Liste server-side: Prodotti

**What to build:** La lista Prodotti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 ? Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Prodotti non filtra più l?intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna ? re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 ? claimed by implement loop

## Done

- Aggiunto `listProducts` in `src/data-access/products.ts` (allowlist sort/filter su `code`, include membership/entranceSet, ORDER BY + tie-break `code`).
- Pagina `/products` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: delete ? `refetch`; edit ? update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-products.ts` (paginazione, filtri, allowlist sort, kind derivato escluso).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllProducts` tenuto per dropdown Acquisti; sort colonna derivata `kind` escluso dall?allowlist (fallback default `code`).
