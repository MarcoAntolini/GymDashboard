# Wayfinder — Roadmap TODO GymDashboard

## Destination

Roadmap decisionale completa del backlog in `docs/TODO.md`: ogni voce classificata (subito / dopo / fuori scope), decisioni di dominio e architettura chiuse, effort di build successivi ordinati — **senza** implementare le feature in questa mappa.

## Notes

- Dominio: `CONTEXT.md`, `docs/domain/`, `PRODUCT.md`
- Skills utili per sessioni successive: `/grilling`, `/domain-modeling`, `/research`, `/prototype`, Impeccable per UI
- Ordine ondate concordato: **Clarification → Bug fix + Architecture/data access → New features + UI polish**
- Vincolo filtri: tutti i filtri **e** la search lato DB; highlight tabella resta UI opzionale
- Analytics: set chiuso di 5 famiglie (cassa, mix prodotti, frequenza ingressi, fidelizzazione proxy OLTP, operazioni bancone)
- La mappa pianifica **tutto** il TODO, polish tabella incluso

## Decisions so far

- [Differenze Admin e Dipendente](issues/01-admin-dipendente-rbac.md) — RBAC per sezione nav sufficiente; stesse CRUD sulle entità consentite; Approvazione Account resta feature Admin dedicata
- [Colonne native vs derivate in tabella](issues/02-colonne-derivate-tabelle.md) — per guidelines: attributi nativi + derivati solo via query/vista, sola lettura, dove il dominio li definisce
- [Snapshot e propagazione modifiche](issues/03-snapshot-propagazione.md) — Listino non riscrive Acquisti passati; policy A: snapshot importo + durata + N ingressi su Acquisto alla vendita
- [Campi editabili vs read-only](issues/04-editabilita-campi.md) — chiavi, snapshot di vendita e fatti con Ingressi collegati: read-only o Restrict; anagrafica e bozze editabili
- [Filtri e search lato DB](issues/05-filtri-search-lato-db.md) — vincolo strutturale: migrare filtri attuali + search; entrambi via query parametrizzate; niente filtri solo-client su dataset paginato
- [Perimetro query analytics business](issues/06-perimetro-analytics.md) — cinque famiglie in scope; fuori ML/LTV predittivo/export BI multi-sede
- [Ordine ondate roadmap](issues/07-ordine-ondate-roadmap.md) — Clarification → Bug+Arch → Feature+UI
- [Migrazione filtri verso data-access](issues/12-migrazione-filtri-data-access.md) — `listX(ListQuery)` + offset pagination; Prisma `contains`/`in`; Fase 0 infrastruttura poi clients → payments; asset: [research/12-migrazione-filtri-data-access.md](research/12-migrazione-filtri-data-access.md)

## Not yet specified

- Dettaglio SQL/indici per ogni famiglia analytics (dipende da [Design query analytics](issues/13-design-query-analytics.md) e [Schema snapshot durata/N su Acquisto](issues/08-schema-snapshot-acquisto-durata-n.md))
- Effort di implementazione concreti (branch/PR slice) — emerge da [Classificazione finale backlog](issues/18-classificazione-finale-backlog.md)

## Out of scope

<!-- vuoto finché un ticket non viene escluso dalla destinazione -->
