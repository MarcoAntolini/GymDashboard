# 04 — Listino senza tipo, chiave composta, Decimal

**What to build:** L’operatore gestisce il Listino come prezzo per (anno, prodotto). Il “tipo” (Abbonamento vs Pacchetto) serve solo a filtrare quali Prodotti compaiono in UI; non viene salvato sulla riga di Listino. I prezzi sono Decimal a due decimali end-to-end.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** claimed

- [ ] CRUD Listino usa solo la chiave composta (year, productCode) — niente tipo in payload/schema Zod/mock
- [ ] Il selettore tipo in UI filtra i Prodotti ma non scrive un campo tipo sul Listino
- [ ] Prezzi gestiti come Decimal (o stringa a 2 decimali) in create/edit e mock
- [ ] List/edit/delete per chiave composta funzionano dopo la migrate

**Source:** `docs/.scratch/align-prisma-app/issues/03-listino-senza-tipo-decimal.md`
