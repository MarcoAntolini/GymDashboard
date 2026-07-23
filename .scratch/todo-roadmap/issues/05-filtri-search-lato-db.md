# Filtri e search lato DB

**Type:** grilling

**Status:** resolved

## Question

«I filtri devono essere lato DB» — qual è il perimetro? Include la search testuale delle tabelle? Cosa resta lato client?

## Answer

**Vincolo strutturale** per tutte le entità con elenchi/filtri/statistiche:

1. Migrare **tutti i filtri attuali** (faceted, per colonna, periodo) da TanStack client-side a parametri su data-access/Prisma/SQL.
2. Migrare anche la **search** — predicato DB parametrizzato (`contains`/`LIKE` su colonne nominate), non search solo sulla pagina caricata.
3. **Resta client-side:** paginazione UI state, ordinamento colonne se locale, **search highlight** (render puro), loading/error/empty states.
4. Coerente con proposta (filtri tipo/periodo) e guidelines (query reali, indici su `WHERE`).
