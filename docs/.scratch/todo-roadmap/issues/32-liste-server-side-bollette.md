# 32 — Liste server-side: Bollette

**What to build:** La lista Bollette usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Bollette non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-27 — claimed by implement loop

## Done

- Aggiunto `listBills` in `src/data-access/bills.ts` (allowlist sort/filter; `paymentId` exact; `provider` contains; ORDER BY + tie-break PK `paymentId`).
- Config `src/lib/list/bills.ts` (sort: paymentId/description/provider; filter: paymentId/provider; default `paymentId` desc).
- Pagina `/bills` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-bills.ts` (paginazione, filtri, allowlist sort, paymentId/provider).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllBills` tenuto per consumer non-lista.
