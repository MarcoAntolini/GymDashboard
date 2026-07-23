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

- 2026-07-23 — claimed by implement loop (cloud, branch ticket-loop)

## Done

- Added `acquisti.durata` / `acquisti.numero_ingressi` (nullable XOR snapshots) via migration `20260723210000_acquisto_snapshot_durata_n`; Prisma `Purchase.duration` / `entranceNumber`.
- `createPurchase` copies durata/N from Prodotto specialization at sale; `editPurchase` never rewrites snapshots.
- Domain helpers `remainingEntrancesForPurchase` / `isMembershipValidAt` / `canJustifyEntranceAt` read only Acquisto snapshots; DTO exposes `remainingEntrances` + read-only UI columns.
- Smoke `scripts/smoke-acquisto-snapshot.ts` proves product duration/N updates leave sold Acquisti unchanged; unit tests cover residuo/validità.
- Domain docs (`02-schema-er`, `03-schema-logico`) updated for snapshot fields. Prisma 7 MariaDB adapter wired in `src/lib/db.ts` so create path runs.
