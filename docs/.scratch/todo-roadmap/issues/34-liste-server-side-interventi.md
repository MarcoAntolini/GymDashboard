# 34 — Liste server-side: Interventi

**What to build:** La lista Interventi usa le fondamenta del ticket 19: filtri applicati su Conferma, ordinamento colonna via nuova query DB, paginazione server-side. Demoabile da sola su questa entità.

**Blocked by:** 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**Status:** resolved

- [x] List Interventi non filtra più l’intero dataset solo in frontend
- [x] Conferma/Filtra esegue la query; keystroke nei filtri non martellano il backend
- [x] Sort colonna → re-query con ORDER BY + paginazione corretta
- [x] Paginazione server-side con totale/count usabile in UI
- [x] Empty da filtri distinto da dataset vuoto (se già supportato dalla shell)

## Comments

- 2026-07-27 — claimed by implement loop

## Done

- Aggiunto `listInterventions` in `src/data-access/interventions.ts` (allowlist sort/filter; `paymentId` exact; `maker` contains; ORDER BY + tie-break PK `paymentId`).
- Config `src/lib/list/interventions.ts` (sort: paymentId/description/maker/startingTime/endingTime; filter: paymentId/maker; default `paymentId` desc).
- Pagina `/interventions` migrata a `useServerList` + `DataTable` `serverList`; filtri solo su **Filtra**.
- CRUD: delete → `refetch`; edit → update ottimistico su pagina corrente.
- Smoke DB: `npx tsx scripts/smoke-list-interventions.ts` (paginazione, filtri, allowlist sort, paymentId/maker).
- Commit: `f0f208c` — `feat(interventi): lista server-side Filtra/sort/paginazione (ticket 34)`.
- Deferral: empty-from-filters vs empty-dataset resta ticket 39; `getAllInterventions` tenuto per consumer non-lista.
