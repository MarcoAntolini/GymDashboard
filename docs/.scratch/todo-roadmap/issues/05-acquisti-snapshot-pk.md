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

- 2026-07-24 — claimed by implement loop

## Done

- Data-access: `getPurchase(id)`, `deletePurchase({ id })` only; create risolve amount da Listino se vuoto; write `Prisma.Decimal`; delete mappa P2003/P2014 → messaggio Restrict IT.
- Zod/UI: schema solo `{ clientId, date, amount, productCode }` (amount string ≤2 decimali); Tipo è state locale `ProductKind`, non FormField/payload.
- Create: `CatalogAmountDefault` propone prezzo Listino su change date/productCode; override sconto libero.
- Mock: amount da Listino `(YEAR(date), productCode)` se presente, altrimenti Decimal random; niente tipo.
- `tsc`: area purchases allineata al floor listino (solo TS7031 `field` da tipi RHF rotti project-wide).
- Commit: `feat(acquisti): snapshot importo su id surrogato (ticket 05)`.
