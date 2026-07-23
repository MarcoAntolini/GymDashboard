# 05 — CRUD actions and form feedback

**What to build:** Create / modifica / eliminazione sono prevedibili: dove la creazione avviene solo da un flusso “padre” (es. uscite tipizzate via Pagamenti) è chiaro; i dialog non falliscono in silenzio; submit ha stato di progresso; copy e confirmations parlano il linguaggio del dominio, non “Edit row data”.

**Blocked by:** 04 — Core entity tables: columns, filters, formatting

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable critique` su toolbar azioni + dialog create/edit/delete (focus: error prevention, recovery, consistency, help).
3. Fix con `$impeccable harden` e `$impeccable clarify` (e altri solo se nel critique).
4. `$impeccable polish` sulle surface azioni/dialog.
5. Smoke: create + edit + delete fallito/riuscito su almeno un’entità semplice e su Pagamenti tipizzati.

## Acceptance criteria

- [ ] Feedback errore create/edit/delete è coerente (niente mix alert/toast/silenzio sulla stessa shell)
- [ ] Submit disabilita / mostra loading mentre la mutazione è in corso; dialog non chiude su fallimento
- [ ] Se alcune tabelle non espongono create locale, l’UI spiega dove creare (es. specializzazioni Pagamento)
- [ ] Edit di Pagamento non lascia i dettagli di specializzazione inconsistenti rispetto a data/importo/tipo
- [ ] Copy dialog/confirm usa termini di dominio e spiega conseguenze (soprattutto delete con Restrict)
- [ ] Critique Impeccable eseguito; P0/P1 su azioni risolti o deferred con motivo

## Glossary

Pagamento (Stipendio, Bolletta, Attrezzatura, Intervento), Acquisto, Ingresso — `CONTEXT.md`.

## Critique notes (degraded)

⚠️ DEGRADED: single-context (subagent session; dual Assessment A/B not spawned)

P0 resolved: silent create/edit failures → sonner toast; `alert()` delete → toast; missing submit loading; generic “Edit row data”; empty create toolbars without guidance; `editPayment` ignoring specialization / type changes.

P1 deferred: full Italianization of every create-form field label outside Pagamenti (ticket 06 domain fidelity); live browser smoke of Restrict delete paths against a running DB.
