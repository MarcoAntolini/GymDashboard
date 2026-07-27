# 35 — Liste server-side: Pagamenti

**What to build:** La lista Pagamenti usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Pagamenti non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-27 — claimed by implement loop

## Done

- Aggiunto `listPayments` in `src/data-access/payments.ts` (allowlist sort/filter; `id` exact; `type` exact enum; ORDER BY + tie-break PK `id`).
- Config `src/lib/list/payments.ts` (sort: id/date/amount/type; filter: id/type; default `date` desc).
- Pagina `/payments` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: create/delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-payments.ts` (paginazione, filtri, allowlist sort, id/type).
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllPayments` tenuto per consumer non-lista.
