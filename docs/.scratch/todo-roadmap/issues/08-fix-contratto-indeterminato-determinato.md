# 08 — Fix UI Contratto indeterminato vs determinato

**What to build:** Se il Contratto è a tempo indeterminato, la data di fine non è visibile (stato in corso). Se è a tempo determinato, sono visibili sia data inizio che data fine. Correzione del comportamento invertito attuale.

**Blocked by:** 07 — Contratti senza intervalli sovrapposti

**Status:** claimed

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

- [ ] Contratto indeterminato: UI non mostra data fine (o la presenta come in corso); endingDate resta null/assente
- [ ] Contratto determinato: UI mostra e richiede data inizio e data fine
- [ ] Create/edit rispettano la stessa regola (niente data fine obbligatoria sull’indeterminato)
- [ ] Lista/dettaglio non invertono i due casi
