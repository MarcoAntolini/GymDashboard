# 22 — Liste server-side: Acquisti

**What to build:** La lista Acquisti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Acquisti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listPurchases` in `src/data-access/purchases.ts` (allowlist sort/filter, where su id/clientId/client/productCode, ORDER BY anche join client e snapshot amount/duration/entranceNumber, tie-break `id`).
- Pagina `/purchases` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**; tipo prodotto resta UI locale sul create (non in allowlist server).
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-purchases.ts` (paginazione, filtri, allowlist sort, sort join/snapshot).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllPurchases` tenuto per eventuali consumer non-lista; sort colonna derivata `type` escluso dall’allowlist (fallback default).
