# 40 — Shell layout: separator sidebar/toolbar + overflow DataTable

**What to build:** Allinea i Separator orizzontali di sidebar user-block e toolbar pagina: stessa altezza header con padding attorno ai Button h-10; placeholder e Panoramica allineati. Niente overflow-x-auto sul pane principale; min-w-0 lungo la catena flex; scroll tabelle larghe con overflow-auto contain-paint.

**Blocked by:** 18 — Nav IA + glossary IT + layout navbar standard

**Status:** resolved

- [x] Separator sidebar user-block e toolbar pagina allineati (niente scalino)
- [x] Padding verticale coerente intorno ai Button default (h-10)
- [x] Pane principale dashboard senza overflow-x-auto che scrolla tutta la pagina
- [x] Catena flex con min-w-0; wrapper tabella con overflow-auto contain-paint

## Comments

- 2026-07-28 — claimed by implement loop

## Done

- Header sidebar user-block, toolbar `Dashboard` e `DashboardPlaceholder` unificati a `h-14` + `py-2` intorno a controlli `h-10` (Separator allineati, niente scalino).
- Pane principale: `overflow-hidden` + `min-w-0` (niente scroll orizzontale di tutta la pagina).
- Catena flex `min-h-0`/`min-w-0` da root layout → DesktopOnly → Card → Dashboard → DataTable.
- Wrapper tabella: `overflow-auto contain-paint` per scroll locale sulle colonne larghe.
- Deferral: pagina Panoramica `/` non esiste ancora (ticket 51); userà lo stesso header shell quando arriverà.
- Commit: `c067155`.
