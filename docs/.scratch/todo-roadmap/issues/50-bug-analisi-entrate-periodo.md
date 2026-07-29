# 50 — Bug: analisi entrate per tipo periodo

**What to build:** L’analisi entrate rispetta il tipo periodo scelto (giornaliero, settimanale, mensile, annuale): l’aggregazione e la visualizzazione sono coerenti con quella granularità.

**Blocked by:** 06 — Registrazione Ingresso (transazione + tie-break)

**Status:** resolved

- [x] Selezione tipo periodo giornaliero/settimanale/mensile/annuale disponibile
- [x] Query e chart/tabella aggregati secondo il tipo scelto
- [x] Cambio tipo periodo aggiorna i dati in modo corretto
- [x] Empty/loading usabili sulla surface analisi entrate

## Comments

- 2026-07-29 — claimed by implement loop

## Done

- Helper condiviso `src/lib/period-aggregation.ts`: serie temporale continua per granularità giornaliera/settimanale/mensile/annuale (range inclusivo fine-giorno).
- `getEntrateByPeriod` su Acquisti: importi (e conteggi) aggregati per tipo periodo; UI **Analisi entrate** su `/purchases` con select periodo, chart, loading/error/empty e re-fetch al cambio tipo.
- Allineata anche l’analisi Ingressi (`getEntrancesByPeriod` + UI unificata): prima confondeva “giornaliero/settimanale/mensile” con distribuzione ora/weekday/mese-anno (fuori scope frequenza → ticket 53).
- Smoke: `scripts/verify-period-aggregation.ts` (ok).
- Commit: `6ad0fa6`
- Deferral: Panoramica home Entrate/Uscite resta ticket 51 (riusa gli helper periodo).
