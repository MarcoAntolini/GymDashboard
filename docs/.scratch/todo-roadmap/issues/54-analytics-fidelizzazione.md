# 54 — Analytics: fidelizzazione proxy

**What to build:** Indicatori OLTP: clienti attivi nel periodo, riacquisti/rinnovi, clienti a rischio (nessun Ingresso da N giorni con titolo ancora valido o scaduto di recente). Usa snapshot Acquisto.

**Blocked by:** 02 — Snapshot durata e N ingressi su Acquisto; 52 — Analytics: cassa + mix prodotti

**Status:** resolved

- [x] Clienti attivi nel periodo (definizione esplicitata in UI/copy)
- [x] Proxy rinnovo/riacquisto misurabile da Acquisti
- [x] Lista/conteggio a rischio con soglia N giorni documentata
- [x] Nessun modello ML / LTV predittivo

**Source:** `docs/.scratch/analytics/issues/13-analytics-fidelizzazione.md`

## Comments

- 2026-07-30 — claimed by implement loop

## Done

- `fidelity-proxy.ts`: attivi (Ingresso nel periodo), riacquisti (Acquisto con prior), a rischio (silenzio ≥14 gg + titolo valido o scaduto/esaurito ≤30 gg via snapshot durata/N).
- `getOverviewStats` espone `fidelity` con definizioni copy per UI.
- Panoramica `/`: sezione Fidelizzazione (conteggi + tabella a rischio).
- Smoke: `scripts/verify-fidelity-proxy.ts`.
- Nessun ML / LTV predittivo.
- Commit: `4c906d0`.
