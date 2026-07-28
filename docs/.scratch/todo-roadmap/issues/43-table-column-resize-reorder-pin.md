# 43 — Colonne: resize, reorder, pin

**What to build:** L'operatore può ridimensionare, riordinare e fissare una o più colonne così restano visibili durante lo scroll orizzontale.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting

**Status:** resolved

- [x] Resize colonne in tabella
- [x] Reorder colonne (drag o equivalente accessibile)
- [x] Pin di una o più colonne sempre visibili con scroll orizzontale
- [x] Stato colonne non rompe sort/filtri server-side

## Comments

- 2026-07-28 18:49 — claimed by implement loop

## Done

- Resize colonne via handle sul bordo header (`columnResizeMode: onChange`, sizing client-only).
- Reorder accessibile dal menu header: Sposta a sinistra/destra (`columnOrder`; `__select` / `actions` bloccate).
- Pin sinistra/destra + sblocca dal menu header; celle sticky nello scroll orizzontale del container tabella.
- Sort/filtri server-side invariati: order/sizing/pinning restano state UI TanStack, non toccano `sorting` / `draftFilters` / fetch.
- Helper puro `table-column-layout.ts` + menu esteso in `TableSortableHeader`.
