# 04 — Listino senza tipo, chiave composta, Decimal

**What to build:** L’operatore gestisce il Listino come prezzo per (anno, prodotto). Il “tipo” (Abbonamento vs Pacchetto) serve solo a filtrare quali Prodotti compaiono in UI; non viene salvato sulla riga di Listino. I prezzi sono Decimal a due decimali end-to-end.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

- [x] CRUD Listino usa solo la chiave composta (year, productCode) — niente tipo in payload/schema Zod/mock
- [x] Il selettore tipo in UI filtra i Prodotti ma non scrive un campo tipo sul Listino
- [x] Prezzi gestiti come Decimal (o stringa a 2 decimali) in create/edit e mock
- [x] List/edit/delete per chiave composta funzionano dopo la migrate

**Source:** `docs/.scratch/align-prisma-app/issues/03-listino-senza-tipo-decimal.md`

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Data-access Catalog allineato a `year_productCode` + `Prisma.Decimal`; include `product.membership` / `entranceSet` per tipo derivato.
- Zod/form: solo `{ year, productCode, price }` (price stringa ≤2 decimali); selettore Tipo è state UI locale (`ProductKind`), non FormField.
- Colonna Type in tabella derivata da specializzazione prodotto (`productKindFromProduct`); niente campo `type` su Listino.
- Mock già senza `type` e con Decimal a 2 decimali (verificato).
- Smoke DB: create/get/edit/delete per chiave composta OK; sample keys `year,productCode,price`.
