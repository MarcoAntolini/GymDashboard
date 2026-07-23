# 05 — Acquisti: PK surrogata, snapshot importo, niente tipo

**What to build:** L’operatore crea/modifica Acquisti senza campo tipo persistito. L’importo di default è lo snapshot dal Listino dell’anno della data di Acquisto (override sconto ammesso). Lookup e delete usano l’id surrogato. Delete con Ingressi → Restrict chiaro.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma; 04 — Listino senza tipo, chiave composta, Decimal

**Status:** ready-for-agent

- [ ] Create/edit Acquisto non accettano né salvano tipo; mock senza tipo
- [ ] In create, amount default = prezzo Listino (YEAR(date), productCode) se esiste; override sconto consentito
- [ ] Get/update/delete Acquisto per id
- [ ] Delete Acquisto con Ingressi → errore utente-facing (Restrict)
- [ ] Filtro tipo in UI filtra Prodotti per specializzazione, non persiste enum come colonna

**Source:** `docs/.scratch/align-prisma-app/issues/04-acquisti-snapshot-pk.md`
