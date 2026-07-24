# 12 — Capture product context with Impeccable init

**What to build:** Il progetto ha un contesto di prodotto catturato per la dashboard OLTP della palestra, così i critique/fix Impeccable successivi ragionano su audience e register corretti. Nessun redesign UI in questo ticket.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Esiste contesto prodotto persistito leggibile dai comandi Impeccable successivi
- [x] Il contesto riflette dominio palestra OLTP: Amministratore vs Dipendente, operazioni quotidiane — non marketing
- [x] Register impostato come product/dashboard
- [x] Nessun redesign UI in questo ticket

**Source:** `docs/.scratch/dashboard-data-ux/issues/01-impeccable-init.md`

Usare skill /impeccable (init). Glossario: CONTEXT.md.

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Verificato `PRODUCT.md` + `DESIGN.md` già presenti e caricati da `context.mjs` (register `product`, platform `web`).
- Contesto allineato al dominio OLTP: Dipendente (primary) vs Amministratore (secondary); Ingressi/Acquisti/Pagamenti; anti-landing.
- Completato Step 6 init: creato `.impeccable/live/config.json` (Next App Router `src/app/layout.tsx`; CSP assente → `cspChecked: true`).
- Nessun redesign UI; PRODUCT/DESIGN non sovrascritti (già validi).