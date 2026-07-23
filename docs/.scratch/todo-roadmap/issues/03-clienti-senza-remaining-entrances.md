# 03 — Clienti senza ingressi rimanenti persistiti

**What to build:** L’operatore gestisce i Clienti senza un contatore salvato di ingressi rimanenti. Il residuo, se mostrato, è solo derivato dagli Acquisti di Pacchetto. Cancellare un Cliente che ha Acquisti fallisce in modo chiaro (Restrict).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** claimed

- [ ] Create/edit/list Cliente non espongono né persistono remainingEntrances
- [ ] Mock e form/Zod allineati: nessun campo residuo sul Cliente
- [ ] (Opzionale) UI può mostrare residuo derivato da query, mai da colonna Cliente
- [ ] Delete Cliente con Acquisti dipendenti → errore utente-facing, nessun delete a cascata

**Source:** `docs/.scratch/align-prisma-app/issues/02-clienti-senza-remaining-entrances.md`
