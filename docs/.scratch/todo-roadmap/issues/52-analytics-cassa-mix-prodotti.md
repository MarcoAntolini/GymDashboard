# 52 — Analytics: cassa + mix prodotti

**What to build:** L’operatore consulta Entrate/Uscite aggregate per periodo e tipo, e il mix Abbonamenti vs Pacchetti. In primo piano anche in Panoramica; consultabili anche dalla relativa tabella/vista analytics.

**Blocked by:** 51 — Panoramica home: analytics in primo piano

**Status:** resolved

- [x] Query DB aggregate Entrate/Uscite per periodo e tipo
- [x] Ranking prodotti / Abbonamenti vs Pacchetti per ricavo e quantità
- [x] UI su Panoramica e sulla relativa superficie tabella/analytics
- [x] Nessuna metrica vanity fuori perimetro

**Source:** `docs/.scratch/analytics/issues/11-analytics-cassa-mix-prodotti.md`

## Comments

- 2026-07-29 — claimed by implement loop

## Done

- `rankProductsByRevenue` in `src/lib/product-ranking.ts`; `getOverviewStats` espone `productRanking` (ricavo → quantità → codice).
- Panoramica `/`: tabella «Mix prodotti» sotto le ripartizioni Entrate/Uscite; link a Analisi entrate/uscite.
- Acquisti: sheet Analisi entrate arricchito con Abb vs Pacchetti + ranking prodotti (`getProductMixForPeriod`).
- Pagamenti: sheet **Analisi uscite** (`getUsciteByPeriod`) speculare alle entrate.
- Smoke: `scripts/verify-cassa-mix.ts`.
- Commit: `93fc8fb`
- Nessuna vanity KPI (solo cassa + mix operativo).
- Deferral: frequenza bancone / fidelizzazione → ticket **53** / **54**.
