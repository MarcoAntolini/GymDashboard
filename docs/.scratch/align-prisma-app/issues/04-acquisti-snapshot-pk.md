# 04 — Acquisti: PK surrogata, snapshot importo, niente tipo

**What to build:** L’operatore crea/modifica Acquisti senza campo `tipo` persistito. L’importo di default è lo snapshot dal Listino dell’anno della data di Acquisto (override esplicito per sconto ammesso). Lookup e delete usano l’id surrogato. Cancellare un Acquisto che ha Ingressi fallisce in modo chiaro (Restrict). Il filtro UI per tipo continua a filtrare Prodotti via join Abbonamento/Pacchetto, senza scrivere `tipo` sull’Acquisto.

**Blocked by:**
- 01 — Migrate + reset DB al nuovo schema Prisma
- 03 — Listino senza tipo, chiave composta, Decimal

**Status:** done

- [x] Create/edit Acquisto non accettano né salvano `tipo`; mock senza `tipo`
- [x] In create, `amount` default = prezzo Listino `(YEAR(date), productCode)` se esiste; override sconto consentito
- [x] Get/update/delete Acquisto per `id` (niente PK composite legacy)
- [x] Delete Acquisto con Ingressi → errore utente-facing (Restrict)
- [x] Filtro tipo in UI filtra Prodotti per specializzazione, non persiste enum come colonna

## Notes (agent)

- Data-access: CRUD per `id`; create risolve snapshot da `listini` se `amount` omesso/vuoto; write via `Prisma.Decimal`; include `prodotto.membership` / `prodotto.entranceSet` per tipo derivato in tabella.
- Delete mappa Prisma `P2003`/`P2014` (Restrict su `Entrance.purchaseId`) a Error chiaro; `ItemActions` fa alert sul fallimento.
- Zod/form: solo `{ clientId, date, amount, productCode }` con `amount` stringa a ≤2 decimali; selettore Tipo è state UI locale (`ProductKind`), non FormField.
- Create UI: `CatalogAmountDefault` (watch date+productCode → `getCatalog`) propone il prezzo Listino; l’operatore può sovrascrivere per sconto.
- Mock: niente `type`; amount da Listino dell’anno se presente, altrimenti `Prisma.Decimal` random.
- `tsc --noEmit`: area purchases/mockPurchases senza errori (restano errori preesistenti su entrances/contracts/payments fuori scope).
