# 40 — Shell layout: separator sidebar/toolbar + overflow DataTable

**What to build:** Allinea i Separator orizzontali di sidebar user-block e toolbar pagina: stessa altezza header con padding attorno ai Button h-10; placeholder e Panoramica allineati. Niente overflow-x-auto sul pane principale; min-w-0 lungo la catena flex; scroll tabelle larghe con overflow-auto contain-paint.

**Blocked by:** 18 — Nav IA + glossary IT + layout navbar standard

**Status:** resolved

- [x] Separator sidebar user-block e toolbar pagina allineati (niente scalino)
- [x] Padding verticale coerente intorno ai Button default (h-10)
- [x] Pane principale dashboard senza overflow-x-auto che scrolla tutta la pagina
- [x] Catena flex con min-w-0; wrapper tabella con overflow-auto contain-paint

## Comments

- 2026-07-24 — claimed by implement loop (cloud)

## Done

- Sidebar user-block, Dashboard toolbar e DashboardPlaceholder usano tutti `h-14` + `py-2` (allineati a Button default `h-10`); niente scalino sui Separator.
- Pane principale: rimosso `overflow-x-auto`; sostituito con `min-w-0 flex-1 overflow-hidden`.
- Catena flex: `min-w-0` / `min-h-0` su Card, main pane, Dashboard e DataTable roots.
- Wrapper tabella (`DataTable` + `ServerDataTable`): `overflow-auto contain-paint` + `min-w-0` così lo scroll resta sul bordo tabella.
