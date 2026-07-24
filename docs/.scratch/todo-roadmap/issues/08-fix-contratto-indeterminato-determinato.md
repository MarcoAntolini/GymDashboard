# 08 — Fix UI Contratto indeterminato vs determinato

**What to build:** Se il Contratto è a tempo indeterminato, la data di fine non è visibile (stato in corso). Se è a tempo determinato, sono visibili sia data inizio che data fine. Correzione del comportamento invertito attuale.

**Blocked by:** 07 — Contratti senza intervalli sovrapposti

**Status:** resolved

- [x] Contratto indeterminato: UI non mostra data fine (o la presenta come in corso); endingDate resta null/assente
- [x] Contratto determinato: UI mostra e richiede data inizio e data fine
- [x] Create/edit rispettano la stessa regola (niente data fine obbligatoria sull’indeterminato)
- [x] Lista/dettaglio non invertono i due casi

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Helper `src/lib/contract-term.ts`: `resolveContractEndingDate`, `contractRequiresEndingDate`, `formatContractEndingDateLabel` (regola §7 E/R).
- Create/edit: `ContractEndingDateField` mostra data fine solo se FixedTerm; su OpenEnded azzera il campo.
- Zod `superRefine` + enforce server-side in `createContract` / `editContract` (indeterminato → null; determinato → required e ≥ start).
- Lista: indeterminato / senza fine → etichetta "In corso"; determinato → data.
- Smoke: `npx tsx scripts/smoke-contract-term.ts`.
