# 51 — Panoramica home: analytics in primo piano

**What to build:** Home post-login (/) con aggregate Entrate/Uscite e misure operative utili in primo piano. Non vanity KPI. La landing può puntare qui. Le analytics di dettaglio restano anche sulle relative tabelle/viste.

**Blocked by:** 38 — Domain fidelity visible in the UI; 39 — Loading, error, and empty states on entity shell; 50 — Bug: analisi entrate per tipo periodo

**Status:** resolved

- [x] Route home/overview raggiungibile dopo login
- [x] Mostra Entrate (Acquisti) / Uscite (Pagamenti) (+ misure utili) su periodo
- [x] Niente hero-metric vanity
- [x] Loading/empty/error usabili

**Source:** `docs/.scratch/dashboard-data-ux/issues/08-statistics-overview-home.md`

Usare skill /impeccable.

## Comments

- 2026-07-29 — claimed by implement loop

## Done

- Route `/` (`src/app/(dashboard)/page.tsx`): Panoramica con periodo «Mese corrente» / «Ultimi 30 giorni».
- `getOverviewStats` in `src/data-access/overview.ts` (`requireRole("Employee")`): Entrate/Uscite/Saldo, conteggio Ingressi, ripartizioni per tipo Acquisto e tipo Pagamento.
- Landing Admin/Dipendente → `/`; nav Operazioni apre con Panoramica.
- Strip saldi tabular (non hero-KPI cards); empty = zeri + CTA verso Acquisti/Ingressi/Pagamenti; loading/error via stati tabella condivisi.
- Smoke: `scripts/verify-overview-home.ts` (preset + GET `/` autenticata).
- Deferral: mix prodotti / analytics cassa dettagliate → ticket **52** (shape ticket 08 / PRODUCT surface notes).
