# 08 — Statistics overview home

**What to build:** Esiste una home di overview con viste aggregate su entrate/uscite (e misure rilevanti alle operazioni frequenti) come da requisiti. Non è un collage di hero-metric generici: serve al lavoro quotidiano della palestra. La landing post-login può puntare qui quando ha senso per il ruolo.

**Blocked by:** 06 — Domain fidelity visible in the UI; 07 — Loading, error, and empty states on entity shell

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable shape` della overview (scope, gerarchia, cosa NON mettere in first viewport).
3. Implementare seguendo lo shape con `$impeccable craft` (o implementazione vincolata allo shape se craft non applicabile 1:1).
4. `$impeccable critique` sulla overview live, poi fix (`layout` / `quieter` / `colorize` / … solo se nel critique).
5. Chiudere con `$impeccable polish`.
6. Evitare anti-pattern product: hero-metric template, card grid identiche, eyebrow ovunque.

## Acceptance criteria

- [ ] Esiste una route home/overview raggiungibile dopo login (role-aware se necessario)
- [ ] Mostra aggregate entrate (Acquisti) e uscite (Pagamenti) su periodo, più eventuali misure davvero utili (es. Ingressi) — non vanity metrics
- [ ] Allineata ai requisiti “statistiche”; riusa pattern chart/sheet già presenti solo se coerenti
- [ ] Stati loading/empty/error della overview sono usabili
- [ ] Critique Impeccable post-implementazione eseguito; P0/P1 risolti o deferred con motivo

## Glossary

Acquisto = entrate da Cliente; Pagamento = uscite tipizzate; Ingresso = accessi in palestra — non mescolare i termini.

## Shape decision (Impeccable)

**Feature:** Panoramica operativa post-login su `/` — aggregate Entrate (Acquisti) / Uscite (Pagamenti) + Ingressi per periodo. Per Dipendente e Amministratore (Employee role; Admin inherits).

**Primary action:** Capire in un colpo se cassa e flussi del periodo sono coerenti, poi saltare a Ingressi / Acquisti / Pagamenti.

**Direction:** Restrained product (DESIGN.md). Scene: bancone/ufficio palestra, luce diurna, operatore che apre la giornata o chiude il turno — light/system theme, densità da strumento non da report vanity.

**Layout:** Toolbar (titolo + periodo) → riga saldi Entrate / Uscite / Saldo (tabular, non hero KPI cards) → due tabelle di ripartizione (tipo Acquisto vs tipo Pagamento) → riga Ingressi + link operativi. Periodo: «Mese corrente» | «Ultimi 30 giorni».

**Deliberately excluded:** strip di 4–6 hero-metric cards identiche; sparkline/grafici decorativi (i chart Ingressi restano sulla pagina Ingressi); eyebrows “Overview / Insights”; card grid simmetrica; vanity (clienti totali, “engagement”).

**States:** loading/error via `EntityShell`; empty periodo = zeri + copy actionable (registra Acquisto / Ingresso / Pagamento), non blank.

**Landings:** Admin e Employee → `/` (Panoramica). Ingressi resta in nav Operazioni (alta frequenza).

**Visual probes:** skipped — no Codex image_gen gate; product surface constrained by DESIGN.md.

## Implementation notes

- Route: `/` → `src/app/(dashboard)/page.tsx`
- Data: `src/data-access/overview.ts` (`getOverviewStats`, `requireRole("Employee")`)
- Nav: Operazioni → Panoramica (`/`); landings in `nav-routes.ts`
- Critique snapshot: `.impeccable/critique/2026-07-21T23-03-49Z__src-app-dashboard-page-tsx.md`
- Charts: not reused on overview (Entrances charts stay on `/entrances`; earnings sheet on contracts) — tables are the coherent pattern here
