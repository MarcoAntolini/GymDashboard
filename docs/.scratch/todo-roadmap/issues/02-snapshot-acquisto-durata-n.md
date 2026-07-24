# 02 — Snapshot durata e N ingressi su Acquisto

**What to build:** Alla vendita di un Prodotto, durata (Abbonamento) e numero ingressi (Pacchetto) restano fissati sull’Acquisto. Cambiare il Prodotto in listino non altera titoli già venduti; giustificazione Ingressi e residuo pacchetto usano lo snapshot.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

- [x] Schema e create Acquisto memorizzano durata e/o N ingressi allo snapshot di vendita (oltre all’importo già presente)
- [x] Giustificazione Ingressi e Ingressi rimanenti leggono lo snapshot dell’Acquisto, non i valori correnti del Prodotto
- [x] Update di durata/N sul Prodotto non cambia Acquisti/Ingressi già registrati
- [x] Tabella/DTO Acquisto (e viste derivate) espongono i valori snapshot in sola lettura dove serve

**Source:** `docs/.scratch/db-decision/issues/01-snapshot-acquisto-durata-n.md`

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Schema `Purchase`: colonne nullable `duration` / `entranceNumber` (+ migration `20260724172000_purchase_snapshot_duration_n`).
- `createPurchase` / `editPurchase` risolvono lo snapshot dalla specializzazione Prodotto; mock allineato.
- Helper dominio `src/lib/domain/purchase-access.ts` (`packageResidual`, `membershipCoversAt`, `snapshotFromProduct`) — base per ticket 06.
- UI Acquisti: colonne sola lettura Durata/N; tipo UI derivato dallo snapshot (non persistito).
- Docs dominio + `CONTEXT.md` aggiornati: residuo/validità leggono snapshot Acquisto.
- Smoke DB: update `abbonamenti.durata` / `pacchetti_ingressi.numero_ingressi` non altera Acquisti esistenti.
- Deferral: `registerEntrance` + tie-break completo → ticket 06; CRUD Acquisto senza `tipo` UI / amount da Listino → ticket 05.
