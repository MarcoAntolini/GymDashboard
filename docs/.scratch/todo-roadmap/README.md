# todo-roadmap

Roadmap unificata da `TODO.md` + ticket preesistenti in `docs/.scratch/*`.

Le cartelle scratch precedenti restano come storico; **questa** è la fonte di lavoro da implementare (`/implement` un ticket alla volta dalla frontier).

## Loop di implementazione

Prompt operativo (claim → implement → commit → stop/next): **[LOOP.md](./LOOP.md)**.

Skill di progetto (cloud + locale): `.agents/skills/` — `impeccable`, `shadcn`, `implement`, `tdd`, `code-review`.

**Catena automatica:** branch `ticket-loop` + Cursor Automation su push (vedi Opzione D in `LOOP.md`).

Avvio locale (chat Agent nuova, un ticket per sessione):

```text
Esegui docs/.scratch/todo-roadmap/LOOP.md — un solo ticket, poi stop.
```

## Frontier iniziale

- [01 — Migrate + reset schema](./issues/01-migrate-reset-schema.md)
- [12 — Impeccable init](./issues/12-impeccable-init.md)

## Issues (54)

- [01-migrate-reset-schema.md](./issues/01-migrate-reset-schema.md)
- [02-snapshot-acquisto-durata-n.md](./issues/02-snapshot-acquisto-durata-n.md)
- [03-clienti-senza-remaining-entrances.md](./issues/03-clienti-senza-remaining-entrances.md)
- [04-listino-senza-tipo-decimal.md](./issues/04-listino-senza-tipo-decimal.md)
- [05-acquisti-snapshot-pk.md](./issues/05-acquisti-snapshot-pk.md)
- [06-registrazione-ingresso.md](./issues/06-registrazione-ingresso.md)
- [07-contratti-no-overlap.md](./issues/07-contratti-no-overlap.md)
- [08-fix-contratto-indeterminato-determinato.md](./issues/08-fix-contratto-indeterminato-determinato.md)
- [09-seed-restrict-decimal-smoke.md](./issues/09-seed-restrict-decimal-smoke.md)
- [10-viste-colonne-native-vs-derivate.md](./issues/10-viste-colonne-native-vs-derivate.md)
- [11-mutazioni-allowlist-campi-editabili.md](./issues/11-mutazioni-allowlist-campi-editabili.md)
- [12-impeccable-init.md](./issues/12-impeccable-init.md)
- [13-rbac-landing.md](./issues/13-rbac-landing.md)
- [14-ruolo-owner-gerarchia.md](./issues/14-ruolo-owner-gerarchia.md)
- [15-maschera-password-account.md](./issues/15-maschera-password-account.md)
- [16-coda-approvazione-account.md](./issues/16-coda-approvazione-account.md)
- [17-profilo-self-service.md](./issues/17-profilo-self-service.md)
- [18-nav-ia-glossary-navbar.md](./issues/18-nav-ia-glossary-navbar.md)
- [19-liste-server-side-fondamenta.md](./issues/19-liste-server-side-fondamenta.md)
- [20-liste-server-side-clienti.md](./issues/20-liste-server-side-clienti.md)
- [21-liste-server-side-ingressi.md](./issues/21-liste-server-side-ingressi.md)
- [22-liste-server-side-acquisti.md](./issues/22-liste-server-side-acquisti.md)
- [23-liste-server-side-prodotti.md](./issues/23-liste-server-side-prodotti.md)
- [24-liste-server-side-abbonamenti.md](./issues/24-liste-server-side-abbonamenti.md)
- [25-liste-server-side-pacchetti-ingressi.md](./issues/25-liste-server-side-pacchetti-ingressi.md)
- [26-liste-server-side-listino.md](./issues/26-liste-server-side-listino.md)
- [27-liste-server-side-dipendenti.md](./issues/27-liste-server-side-dipendenti.md)
- [28-liste-server-side-account.md](./issues/28-liste-server-side-account.md)
- [29-liste-server-side-contratti.md](./issues/29-liste-server-side-contratti.md)
- [30-liste-server-side-timbrature.md](./issues/30-liste-server-side-timbrature.md)
- [31-liste-server-side-stipendi.md](./issues/31-liste-server-side-stipendi.md)
- [32-liste-server-side-bollette.md](./issues/32-liste-server-side-bollette.md)
- [33-liste-server-side-attrezzatura.md](./issues/33-liste-server-side-attrezzatura.md)
- [34-liste-server-side-interventi.md](./issues/34-liste-server-side-interventi.md)
- [35-liste-server-side-pagamenti.md](./issues/35-liste-server-side-pagamenti.md)
- [36-core-entity-tables-formatting.md](./issues/36-core-entity-tables-formatting.md)
- [37-crud-dialog-create-sheet-edit.md](./issues/37-crud-dialog-create-sheet-edit.md)
- [38-domain-fidelity-ui.md](./issues/38-domain-fidelity-ui.md)
- [39-loading-error-empty-states.md](./issues/39-loading-error-empty-states.md)
- [40-shell-separator-overflow-datatable.md](./issues/40-shell-separator-overflow-datatable.md)
- [41-table-readability-forms.md](./issues/41-table-readability-forms.md)
- [42-table-context-menu-multiselect.md](./issues/42-table-context-menu-multiselect.md)
- [43-table-column-resize-reorder-pin.md](./issues/43-table-column-resize-reorder-pin.md)
- [44-table-row-pin.md](./issues/44-table-row-pin.md)
- [45-table-search-highlight.md](./issues/45-table-search-highlight.md)
- [46-tooltip-popover-shadcn.md](./issues/46-tooltip-popover-shadcn.md)
- [47-sweep-ui-italiana.md](./issues/47-sweep-ui-italiana.md)
- [48-mock-data-italiani-owner-seed.md](./issues/48-mock-data-italiani-owner-seed.md)
- [49-calcola-guadagni-dati-dipendente.md](./issues/49-calcola-guadagni-dati-dipendente.md)
- [50-bug-analisi-entrate-periodo.md](./issues/50-bug-analisi-entrate-periodo.md)
- [51-panoramica-home-stats.md](./issues/51-panoramica-home-stats.md)
- [52-analytics-cassa-mix-prodotti.md](./issues/52-analytics-cassa-mix-prodotti.md)
- [53-analytics-frequenza-bancone.md](./issues/53-analytics-frequenza-bancone.md)
- [54-analytics-fidelizzazione.md](./issues/54-analytics-fidelizzazione.md)
