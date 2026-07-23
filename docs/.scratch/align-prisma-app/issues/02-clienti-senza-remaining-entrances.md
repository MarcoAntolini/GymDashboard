# 02 — Clienti senza ingressi rimanenti persistiti

**What to build:** L’operatore gestisce i Clienti senza un contatore salvato di ingressi rimanenti. Il residuo, se mostrato, è solo derivato dagli Acquisti di Pacchetto (ingressi del prodotto meno Ingressi collegati). Cancellare un Cliente che ha Acquisti fallisce in modo chiaro (Restrict), senza cascade silenzioso.

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** done

- [x] Create/edit/list Cliente non espongono né persistono `remainingEntrances`
- [x] Mock e form/Zod allineati: nessun campo residuo sul Cliente
- [x] (Opzionale) UI può mostrare residuo derivato da query, mai da colonna Cliente
- [x] Delete Cliente con Acquisti dipendenti → errore utente-facing, nessun delete a cascata

## Notes (agent)

- Removed leftover create-form field + default for `remainingEntrances` in `clients/page.tsx` (Zod/columns/list/mock/data-access already clean).
- Optional derived residual UI skipped (nice-to-have; checkbox marked as accepted skip).
- `deleteClient` maps Prisma `P2003`/`P2014` (Restrict on `Purchase.clientId`) to a clear Error; `ItemActions` alerts that message on delete failure.
