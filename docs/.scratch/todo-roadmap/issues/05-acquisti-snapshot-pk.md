# 05 — Acquisti: PK surrogata, snapshot importo, niente tipo

**What to build:** L’operatore crea/modifica Acquisti senza campo tipo persistito. L’importo di default è lo snapshot dal Listino dell’anno della data di Acquisto (override sconto ammesso). Lookup e delete usano l’id surrogato. Delete con Ingressi → Restrict chiaro.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma; 04 — Listino senza tipo, chiave composta, Decimal

**Status:** resolved

- [x] Create/edit Acquisto non accettano né salvano tipo; mock senza tipo
- [x] In create, amount default = prezzo Listino (YEAR(date), productCode) se esiste; override sconto consentito
- [x] Get/update/delete Acquisto per id
- [x] Delete Acquisto con Ingressi → errore utente-facing (Restrict)
- [x] Filtro tipo in UI filtra Prodotti per specializzazione, non persiste enum come colonna

**Source:** `docs/.scratch/align-prisma-app/issues/04-acquisti-snapshot-pk.md`

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Create/edit payload: `{ clientId, date, amount, productCode }` only; UI tipo filter is local `ProductKind` (same pattern as Listino), never persisted on Acquisto.
- Create resolves importo from Listino `(YEAR(date), productCode)` when amount empty; `CatalogAmountDefault` proposes Listino price; operator can override for sconto; writes via `Prisma.Decimal`.
- CRUD already keyed by surrogate `id`; amount exposed as ≤2-decimal string end-to-end (forms + DA).
- `deletePurchase` maps Restrict (`P2003`/`P2014`) to `PURCHASE_HAS_ENTRANCES_MESSAGE`; ItemActions toasts the error.
- Mock prefers Listino price for the catalog year when present, else random `Prisma.Decimal`; no `tipo`.
- Domain helpers + tests: `purchase-amount.ts`, Restrict message coverage.
