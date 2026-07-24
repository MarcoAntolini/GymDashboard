# 03 — Clienti senza ingressi rimanenti persistiti

**What to build:** L’operatore gestisce i Clienti senza un contatore salvato di ingressi rimanenti. Il residuo, se mostrato, è solo derivato dagli Acquisti di Pacchetto. Cancellare un Cliente che ha Acquisti fallisce in modo chiaro (Restrict).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

- [x] Create/edit/list Cliente non espongono né persistono remainingEntrances
- [x] Mock e form/Zod allineati: nessun campo residuo sul Cliente
- [x] (Opzionale) UI può mostrare residuo derivato da query, mai da colonna Cliente
- [x] Delete Cliente con Acquisti dipendenti → errore utente-facing, nessun delete a cascata

**Source:** `docs/.scratch/align-prisma-app/issues/02-clienti-senza-remaining-entrances.md`

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Verificato schema/UI/Zod/mock/data-access Cliente: nessun campo `remainingEntrances` (già allineato post-ticket 01).
- Residuo derivato in UI saltato (opzionale AC; userà snapshot Acquisto + helper ticket 02 quando servirà).
- `deleteClient` mappa Prisma `P2003`/`P2014` (Restrict su `Purchase.clientId`) a messaggio utente-facing.
- `ItemActions`: toast errore su delete fallito; `preventDefault` evita chiusura dialog su Restrict.
- Smoke DB: delete cliente con acquisti → messaggio chiaro + riga Cliente ancora presente.
