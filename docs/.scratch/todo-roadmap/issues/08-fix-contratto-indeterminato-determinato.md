# 08 — Fix UI Contratto indeterminato vs determinato

**What to build:** Se il Contratto è a tempo indeterminato, la data di fine non è visibile (stato in corso). Se è a tempo determinato, sono visibili sia data inizio che data fine. Correzione del comportamento invertito attuale.

**Blocked by:** 07 — Contratti senza intervalli sovrapposti

**Status:** resolved

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

- [x] Contratto indeterminato: UI non mostra data fine (o la presenta come in corso); endingDate resta null/assente
- [x] Contratto determinato: UI mostra e richiede data inizio e data fine
- [x] Create/edit rispettano la stessa regola (niente data fine obbligatoria sull’indeterminato)
- [x] Lista/dettaglio non invertono i due casi

## Done

- Domain helper `contract-term.ts`: OpenEnded → endingDate null / "In corso"; FixedTerm → endingDate required ≥ startingDate
- Create/edit UI: `ContractEndingDateField` shows picker only for FixedTerm; OpenEnded clears endingDate and shows "In corso"
- Zod `formSchema` + data-access `createContract`/`editContract` enforce the same rule
- Lista endingDate column uses `formatContractEndingDateDisplay` (no type inversion)
- Mock contracts align type with endingDate
