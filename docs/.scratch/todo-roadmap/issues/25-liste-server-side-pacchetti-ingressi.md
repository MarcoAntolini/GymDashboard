# 25 — Liste server-side: Pacchetti ingressi

**What to build:** La lista Pacchetti ingressi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Pacchetti ingressi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-26 — claimed by implement loop

## Done

- Aggiunto `listEntranceSets` in `src/data-access/entranceSets.ts` (allowlist sort/filter su `productCode`/`entranceNumber`, ORDER BY + tie-break `productCode`).
- Pagina `/entrance-sets` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra** (entranceNumber exact int; niente più faceted client-side).
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-entrance-sets.ts` (paginazione, filtri, allowlist sort, sort entranceNumber).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllEntranceSets` tenuto per eventuali consumer non-lista.
