# 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**What to build:** Esiste un contratto condiviso data-access + pattern UI per liste: filtri applicati solo su Conferma/Filtra (niente query a ogni keystroke), cambio ordinamento colonna riesegue la query con ORDER BY, paginazione server-side (LIMIT/OFFSET o cursore). Nessuna tabella entity migrata end-to-end in questo ticket (solo fondamenta riusabile).

**Blocked by:** 10 — Viste: colonne native vs derivate; 11 — Mutazioni: allowlist campi editabili; 03 — Clienti senza ingressi rimanenti persistiti; 04 — Listino senza tipo, chiave composta, Decimal; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso; 07 — Contratti senza intervalli sovrapposti

**Status:** resolved

- [x] API/helper condiviso per list query: filtri + sort + page + pageSize + total count
- [x] Pattern UI: controlli filtro con azione Conferma/Filtra esplicita
- [x] Cambio sort colonna → nuova query DB (non sort solo-pagina client)
- [x] Paginazione server-side documentata e riusabile
- [x] Indici candidati per WHERE/ORDER BY frequenti considerati (allineamento a docs/db-guidelines/16-indici.md)
- [x] Nessuna migrazione completa di una tabella entity richiesta qui (i ticket 20–35 la fanno)

## Comments

- 2026-07-23 — claimed by implement loop (cloud); continued after claim commit.

## Done

- Domain contract in `src/lib/domain/list-query.ts`: `normalizeListQuery`, `buildListResult`, `prismaOrderBy`, `toPrismaSkipTake`, empty-kind helper, TanStack sort bridge, `SERVER_TABLE_MANUAL_FLAGS`, and `LIST_INDEX_CANDIDATES` aligned with `docs/db-guidelines/16-indici.md` (documented only — no schema `@@index` migration).
- Data-access runner `src/data-access/list-query.ts` (`runListQuery`) for consistent normalize → count/findMany → `ListQueryResult`.
- UI pattern: `useServerListQuery` (draft vs applied filters; Filtra applies; sort/page re-query), `ServerListToolbar` (Filtra/Reset), `ServerListPagination` (server total/pageCount).
- Tests for domain + `runListQuery`; `package.json` test glob includes `src/data-access/**/*.test.ts`.
- No entity list migrated end-to-end (deferred to tickets 20–35).
