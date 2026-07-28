# 36 — Core entity tables: colonne, filtri, formatting

**What to build:** Sulle entità operative l’operatore legge e filtra per attributi utili: colonne rilevanti, filtri su campi umani, date e importi coerenti col contesto italiano, empty state utile. Parte dopo che tutte le liste 20–35 sono migrate server-side.

**Blocked by:** 13 — RBAC Admin/Employee + landing role-aware; 18 — Nav IA + glossary IT + layout navbar standard; 20 — Clienti; 21 — Ingressi; 22 — Acquisti; 23 — Prodotti; 24 — Abbonamenti; 25 — Pacchetti ingressi; 26 — Listino; 27 — Dipendenti; 28 — Account; 29 — Contratti; 30 — Timbrature; 31 — Stipendi; 32 — Bollette; 33 — Attrezzatura; 34 — Interventi; 35 — Pagamenti

**Status:** resolved

## Comments

- 2026-07-28 — claimed by implement loop

- [x] Colonne core espongono campi usati nelle operazioni frequenti
- [x] Filtri preferiscono campi leggibili rispetto a soli id/FK dove ha senso
- [x] Date e importi formattati in contesto IT
- [x] Empty state utile (non solo No results generico)
- [x] Pattern tabella coerente tra le entità toccate

**Source:** `docs/.scratch/dashboard-data-ux/issues/04-core-entity-tables.md`

Usare skill /impeccable.

## Done

- Aggiunti helper condivisi `formatDateIt` / `formatDateTimeIt` / `formatEur` e etichette dominio (`PAYMENT_TYPE_LABEL`, `CONTRACT_TYPE_LABEL`, `ROLE_LABEL`).
- `DataTable` espone `emptyState`; default IT + copy dominio per tutte le 16 liste operative.
- Join colonne ISA (Stipendi/Bollette/Attrezzatura/Interventi) e Dipendente su Contratti/Timbrature/Account; filtri umani (`employee`, fornitore, …) + `filterLabels` IT.
- Sweep colonne: header IT, niente più `en-US`/`USD` sulle liste; Dipendenti senza address dump in tabella.
- Distinzione empty-from-filters vs empty-dataset e shell loading/error deferiti al ticket **39**; form copy EN e sweep UI completa deferiti a **37**/**47**.
