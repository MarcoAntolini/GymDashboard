# 47 — Sweep UI italiana completo

**What to build:** Ogni elemento UI visibile (label, placeholder, empty, error, dialog, nav, aria dove esposte) è in italiano, allineato al glossario di dominio.

**Blocked by:** 18 — Nav IA + glossary IT + layout navbar standard; 41 — Leggibilità tabelle + form

**Status:** resolved

## Comments

- 2026-07-28 — claimed by implement loop

- [x] Nessuna stringa UI in inglese rimasta sulle surface autenticata e auth
- [x] Termini allineati a CONTEXT.md (Cliente, Ingresso, Acquisto, …)
- [x] Form create/edit e messaggi errore inclusi nello sweep

**Source:** `docs/.scratch/dashboard-data-ux/issues/02-italian-ui-sweep.md`

Usare skill /impeccable e /shadcn dove serve.

## Done

- Messaggi Zod create/edit in italiano (Clienti, Dipendenti, Prodotti, Abbonamenti, Pacchetti ingressi, Listino, Acquisti).
- Auth/Account/Profilo: label e validazione `Username` → `Nome utente`; API login/register e errori profilo allineati.
- Analisi Ingressi: giorni/mesi in italiano + tooltip serie `Ingressi`.
- Fallback data-table `record` → `elemento`; copy delete Restrict senza “record”.
- Brand `Gym Dashboard` e loanword `Password`/`Email` lasciati intenzionalmente.
- Commit: `5fc9643`
