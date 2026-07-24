# 36 — Core entity tables: colonne, filtri, formatting

**What to build:** Sulle entità operative l’operatore legge e filtra per attributi utili: colonne rilevanti, filtri su campi umani, date e importi coerenti col contesto italiano, empty state utile. Parte dopo che tutte le liste 20–35 sono migrate server-side.

**Blocked by:** 13 — RBAC Admin/Employee + landing role-aware; 18 — Nav IA + glossary IT + layout navbar standard; 20 — Clienti; 21 — Ingressi; 22 — Acquisti; 23 — Prodotti; 24 — Abbonamenti; 25 — Pacchetti ingressi; 26 — Listino; 27 — Dipendenti; 28 — Account; 29 — Contratti; 30 — Timbrature; 31 — Stipendi; 32 — Bollette; 33 — Attrezzatura; 34 — Interventi; 35 — Pagamenti

**Status:** claimed

- [ ] Colonne core espongono campi usati nelle operazioni frequenti
- [ ] Filtri preferiscono campi leggibili rispetto a soli id/FK dove ha senso
- [ ] Date e importi formattati in contesto IT
- [ ] Empty state utile (non solo No results generico)
- [ ] Pattern tabella coerente tra le entità toccate

**Source:** `docs/.scratch/dashboard-data-ux/issues/04-core-entity-tables.md`

Usare skill /impeccable.
