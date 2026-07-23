# 03 — Listino senza tipo, chiave composta, Decimal

**What to build:** L’operatore gestisce il Listino come prezzo per `(anno, prodotto)`. Il “tipo” (Abbonamento vs Pacchetto) serve solo a filtrare quali Prodotti compaiono in UI; non viene salvato sulla riga di Listino. I prezzi sono Decimal a due decimali end-to-end (form → write → display).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** ready-for-agent

- [ ] CRUD Listino usa solo la chiave composta `(year, productCode)` — niente `tipo` in payload/schema Zod/mock
- [ ] Il selettore tipo in UI filtra i Prodotti (membership XOR entranceSet) ma non scrive un campo tipo sul Listino
- [ ] Prezzi gestiti come Decimal (o stringa a 2 decimali) in create/edit e mock
- [ ] List/edit/delete per chiave composta funzionano dopo la migrate

## Notes (agent)

- Data-access: `year_productCode` per get/edit/delete; write via `Prisma.Decimal`; include `product.membership` / `product.entranceSet` per tipo derivato in tabella.
- Zod/form: solo `{ year, productCode, price }` con `price` stringa a ≤2 decimali; selettore Tipo è state UI locale (`ProductKind`), non FormField.
- Prisma Client non esporta `PurchaseType` se l’enum non è referenziato da alcun model field → costanti UI locali in `columns.tsx` (stessi valori Membership/EntranceSet).
- Mock: niente `type`; prezzo `Prisma.Decimal(faker.commerce.price(..., dec: 2))`.
- `tsc --noEmit`: area catalogs/mockCatalogs senza errori (restano errori preesistenti su purchases/entrances fuori scope).
