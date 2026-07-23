# 03 — Clienti senza ingressi rimanenti persistiti

**What to build:** L’operatore gestisce i Clienti senza un contatore salvato di ingressi rimanenti. Il residuo, se mostrato, è solo derivato dagli Acquisti di Pacchetto. Cancellare un Cliente che ha Acquisti fallisce in modo chiaro (Restrict).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** resolved

## Comments

- 2026-07-23 — claimed by implement loop (cloud); prior claim was status-only, continuing implementation.

- [x] Create/edit/list Cliente non espongono né persistono remainingEntrances
- [x] Mock e form/Zod allineati: nessun campo residuo sul Cliente
- [ ] (Opzionale) UI può mostrare residuo derivato da query, mai da colonna Cliente — deferred (nice-to-have; residuo già su Acquisto)
- [x] Delete Cliente con Acquisti dipendenti → errore utente-facing, nessun delete a cascata

**Source:** `docs/.scratch/align-prisma-app/issues/02-clienti-senza-remaining-entrances.md`

## Done

- Removed `remainingEntrances` from Cliente Zod schema, list column, create/edit forms, data-access create/edit, and mock seed.
- Schema already had no Cliente counter and `Purchase.clientId` Restrict (ticket 01); app layer now matches.
- `deleteClient` maps Prisma `P2003`/`P2014` to clear Italian Error; `ItemActions` toasts on delete failure (no cascade).
- Domain helper `rethrowRestrictDelete` + unit tests; optional derived Cliente residual UI deferred (already on Acquisto).
