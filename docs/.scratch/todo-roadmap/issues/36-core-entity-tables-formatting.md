# 36 — Core entity tables: colonne, filtri, formatting

**What to build:** Sulle entità operative l’operatore legge e filtra per attributi utili: colonne rilevanti, filtri su campi umani, date e importi coerenti col contesto italiano, empty state utile. Parte dopo che tutte le liste 20–35 sono migrate server-side.

**Blocked by:** 13 — RBAC Admin/Employee + landing role-aware; 18 — Nav IA + glossary IT + layout navbar standard; 20 — Clienti; 21 — Ingressi; 22 — Acquisti; 23 — Prodotti; 24 — Abbonamenti; 25 — Pacchetti ingressi; 26 — Listino; 27 — Dipendenti; 28 — Account; 29 — Contratti; 30 — Timbrature; 31 — Stipendi; 32 — Bollette; 33 — Attrezzatura; 34 — Interventi; 35 — Pagamenti

**Status:** resolved

- [x] Colonne core espongono campi usati nelle operazioni frequenti
- [x] Filtri preferiscono campi leggibili rispetto a soli id/FK dove ha senso
- [x] Date e importi formattati in contesto IT
- [x] Empty state utile (non solo No results generico)
- [x] Pattern tabella coerente tra le entità toccate

**Source:** `docs/.scratch/dashboard-data-ux/issues/04-core-entity-tables.md`

Usare skill /impeccable.

## Comments

- 2026-07-24 — claimed by implement loop (cloud); continuing after claim-only push.

## Done

- Shared `formatDateIt` / `formatDateTimeIt` / `formatCurrencyEur` (`src/lib/format/locale.ts`) + dataset/filters empty copy helpers.
- Core entity tables (Clienti, Ingressi, Acquisti, Prodotti, Listino, Contratti, Pagamenti): IT headers, IT date/EUR cells, useful empty states with next action.
- Filters prefer human fields: Acquisti drop `clientId`; Contratti filter by Dipendente cognome/nome + Tipo IT; Clienti surname-first.
- Contratti list joins Dipendente label; earnings sheet fixed from USD/`en-US` to EUR/`it-IT`.
- Deferred: full form-label IT sweep (ticket 47), DomainBadge/MoneyTone chrome (ticket 38/41), payment specialization joins on Stipendi/Bollette lists (noted in view-columns).
