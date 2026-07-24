# 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**What to build:** Esiste un contratto condiviso data-access + pattern UI per liste: filtri applicati solo su Conferma/Filtra (niente query a ogni keystroke), cambio ordinamento colonna riesegue la query con ORDER BY, paginazione server-side (LIMIT/OFFSET o cursore). Nessuna tabella entity migrata end-to-end in questo ticket (solo fondamenta riusabile).

**Blocked by:** 10 — Viste: colonne native vs derivate; 11 — Mutazioni: allowlist campi editabili; 03 — Clienti senza ingressi rimanenti persistiti; 04 — Listino senza tipo, chiave composta, Decimal; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso; 07 — Contratti senza intervalli sovrapposti

**Status:** resolved

## Comments

- 2026-07-24 — claimed by implement loop

- [x] API/helper condiviso per list query: filtri + sort + page + pageSize + total count
- [x] Pattern UI: controlli filtro con azione Conferma/Filtra esplicita
- [x] Cambio sort colonna → nuova query DB (non sort solo-pagina client)
- [x] Paginazione server-side documentata e riusabile
- [x] Indici candidati per WHERE/ORDER BY frequenti considerati (allineamento a docs/db-guidelines/16-indici.md)
- [x] Nessuna migrazione completa di una tabella entity richiesta qui (i ticket 20–35 la fanno)

## Done

- Contratto `ListQuery` / `ListResult` + `normalizeListQuery` / `toPrismaListArgs` / `buildListResult` in `src/lib/list/`
- Hook `useServerList`: draft filters + **Filtra**, sort/page → re-query immediata
- `DataTable` / `TableToolbar`: mode opzionale `serverList` (`manualSorting`/`Filtering`/`Pagination` + bottone Filtra); mode client legacy invariato
- Docs: `docs/domain/06-liste-server-side.md` + link da README e `16-indici.md` (candidati indici liste)
- Smoke: `npx tsx scripts/smoke-list-query.ts`
- Nessuna entity list migrata (20–35)
