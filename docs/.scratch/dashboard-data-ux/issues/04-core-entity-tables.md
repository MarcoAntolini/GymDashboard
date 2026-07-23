# 04 — Core entity tables: columns, filters, formatting

**What to build:** Sulle entità operative principali (Clienti, Ingressi, Pagamenti, Acquisti, Prodotti/Listino, Contratti) l’operatore legge e filtra per attributi utili al lavoro quotidiano: colonne rilevanti, filtri su campi “umani”, date e importi coerenti col contesto italiano della palestra, empty state utile.

**Blocked by:** 02 — Role enforcement and role-aware landing; 03 — Navigation IA and domain glossary labels

**Status:** ready-for-agent

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable critique` sulle tabelle campione (almeno Clienti, Ingressi, Pagamenti; poi le altre del set).
3. Fix con `$impeccable layout`, `$impeccable clarify`, `$impeccable adapt` (responsive densità) come da critique.
4. `$impeccable polish` sulle surface tabella toccate.
5. Non cambiare regole di business in questo ticket (solo presentazione/filtri/format); la fedeltà dominio pesante è il ticket 06.

## Acceptance criteria

- [ ] Colonne delle entità core espongono campi usati nelle operazioni frequenti, non solo identificatori opachi
- [ ] Filtri/faceted preferiscono campi leggibili (nome Cliente, tipo, periodo) rispetto a soli id/FK dove ha senso
- [ ] Date e importi formattati in modo coerente col dominio (niente locale/valuta fuorvianti tipo USD di default se il contesto è IT)
- [ ] Empty state della tabella non è solo “No results.” generico: indica assenza dati o filtri e la prossima azione plausibile
- [ ] Pattern tabella condiviso resta coerente tra le entità toccate
- [ ] Critique Impeccable eseguito; P0/P1 su densità/hierarchy/filtri risolti o deferred con motivo

## Glossary

Cliente, Ingresso, Acquisto, Pagamento, Prodotto, Listino, Contratto — `CONTEXT.md`.
