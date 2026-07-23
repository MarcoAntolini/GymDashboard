# 06 — Domain fidelity visible in the UI

**What to build:** L’operatore vede e può fidarsi delle regole di dominio nelle superfici Ingressi, Acquisti, Pagamenti e Listino: Ingresso sempre giustificato da un Acquisto; residuo pacchetto derivato dall’Acquisto (non attributo Cliente); Pagamenti tipizzati con campi della specializzazione; Listino per anno e importo Acquisto come snapshot; delete bloccati dal vincolo Restrict comunicati in modo chiaro.

**Blocked by:** 05 — CRUD actions and form feedback

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable critique` sulle surface Ingressi / Acquisti / Pagamenti / Listino (focus: match real world, error prevention, recognition).
3. Fix UI/copy/flussi con `$impeccable harden` e `$impeccable clarify`; se serve ripensare un flusso, `$impeccable shape` solo sulla sotto-surface in scope.
4. `$impeccable polish` sulle surface toccate.
5. Source of truth regole: `CONTEXT.md` + `docs/domain/01-requisiti.md` — la UI non inventa contatori su Cliente né titoli accesso separati.

## Acceptance criteria

- [ ] Registrazione Ingresso espone/rispetta la giustificazione via Acquisto (priorità abbonamento/pacchetto come da requisiti); fallimenti di giustificazione sono comprensibili
- [ ] Nessuna UI presenta “ingressi rimanenti” come campo persistito del Cliente; il residuo pacchetto è per Acquisto (derivato)
- [ ] Lista/dettaglio Pagamenti mostra o rende ispezionabili i campi della specializzazione, non solo tipo generico
- [ ] Listino/Acquisto: anno listino e snapshot importo sono comprensibili in UI
- [ ] Tentativo di delete vietato da Restrict spiega perché non si può eliminare
- [ ] Critique Impeccable eseguito; P0/P1 di fedeltà dominio-in-UI risolti o deferred con motivo

## Glossary

Ingresso, Acquisto, Ingressi rimanenti, Abbonamento, Pacchetto ingressi, Listino, Pagamento — definizioni canoniche in `CONTEXT.md`.

## Notes (agent)

- Critique: ⚠️ DEGRADED single-context (subagent; no isolated A/B). Snapshot: `gym-dashboard/.impeccable/critique/src-app-dashboard-entrances.md`. Detector clean.
- Evitato `useEntityData` / `DataTable` shell per non confliggere con ticket 07.
- `editEntrance` ora ricalcola l’Acquisto giustificante (stessa priorità della registrazione).
