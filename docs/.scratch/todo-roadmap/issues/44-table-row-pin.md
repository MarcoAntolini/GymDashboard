# 44 ? Righe: pin per confronto

**What to build:** L?operatore può fissare una o più righe sempre visibili durante lo scroll verticale, per confrontarle con altre righe.

**Blocked by:** 36 ? Core entity tables: colonne, filtri, formatting

**Status:** resolved

- [x] Pin/unpin di una o più righe
- [x] Righe pinnate restano visibili con scroll verticale
- [x] Compatibile con multi-select e paginazione (comportamento documentato se il pin è solo sulla pagina corrente)

## Comments

- 2026-07-28 20:04 ? claimed by implement loop

## Done

- Pin/unpin riga da context menu e dal menu azioni riga (`Fissa in alto` / `Sblocca riga`); più righe pinnabili insieme.
- Sticky verticale sulle celle delle righe pinnate (sotto l?header), compatibile con column pinning via `mergeCellStickyStyles`.
- Helper puro `table-row-pinning.ts`; stato TanStack `rowPinning` con `keepPinnedRows: false`.
- **Paginazione / filtri:** il pin è solo sulla pagina corrente ? cambio pagina, pageSize o dati azzera i pin (come la multi-select). Selezione e pin sono indipendenti.
- Commit: `600273c`
