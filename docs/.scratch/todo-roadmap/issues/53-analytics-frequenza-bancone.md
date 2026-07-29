# 53 — Analytics: frequenza Ingressi + carico bancone

**What to build:** Si vedono i picchi di affluenza (ora, giorno settimana, mese) e il volume operativo Ingressi + Acquisti per giorno, sulla stessa area analytics/Panoramica.

**Blocked by:** 52 — Analytics: cassa + mix prodotti

**Status:** resolved

- [x] Aggregati Ingressi per ora / giorno settimana / mese
- [x] Volume Ingressi e Acquisti per giorno nel periodo
- [x] UI collegata a Panoramica e/o tabella analytics relativa

**Source:** `docs/.scratch/analytics/issues/12-analytics-frequenza-bancone.md`

## Comments

- 2026-07-30 — claimed by implement loop

## Done

- `frequency-aggregation.ts`: aggregati Ingressi per ora / weekday ISO / mese-dell'anno + volume giornaliero Ingressi+Acquisti.
- `getEntranceFrequencyAndBancone` in `entrances.ts`; `getOverviewStats` espone `entranceFrequency` + `banconeDaily`.
- Panoramica `/`: sezione Frequenza Ingressi + carico bancone (chart).
- Sheet Analisi ingressi: frequenza (3 chart) + dual-bar bancone sotto la serie PeriodType.
- Smoke: `scripts/verify-frequency-aggregation.ts`.
- Deferral: fidelizzazione → ticket **54**.
