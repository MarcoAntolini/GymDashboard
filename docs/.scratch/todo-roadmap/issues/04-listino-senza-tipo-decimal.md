# 04 — Listino senza tipo, chiave composta, Decimal

**What to build:** L’operatore gestisce il Listino come prezzo per (anno, prodotto). Il “tipo” (Abbonamento vs Pacchetto) serve solo a filtrare quali Prodotti compaiono in UI; non viene salvato sulla riga di Listino. I prezzi sono Decimal a due decimali end-to-end.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

- [x] CRUD Listino usa solo la chiave composta (year, productCode) — niente tipo in payload/schema Zod/mock
- [x] Il selettore tipo in UI filtra i Prodotti ma non scrive un campo tipo sul Listino
- [x] Prezzi gestiti come Decimal (o stringa a 2 decimali) in create/edit e mock
- [x] List/edit/delete per chiave composta funzionano dopo la migrate

**Source:** `docs/.scratch/align-prisma-app/issues/03-listino-senza-tipo-decimal.md`

## Done

- Data-access Catalog: lookup/update/delete via `year_productCode`; writes use `Prisma.Decimal`; rows include derived `productKind` from Prodotto specializations.
- Zod/form payload is only `{ year, productCode, price }` with price as ≤2-decimal string; Type selector is local `ProductKind` UI state (not a FormField).
- Mock catalogs: no `type`; price via `Prisma.Decimal(faker.commerce.price(..., dec: 2))`.
- Domain helpers + tests: `product-kind`, `catalog-price`.
- Live DB smoke not run in this environment (MariaDB connection refused); composite key verified against generated Prisma Client types / `tsc` on catalogs area.
