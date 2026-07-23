# 13 — RBAC Admin/Employee + landing role-aware

**What to build:** Un Dipendente autenticato non può aprire route né eseguire azioni riservate all’Amministratore. Dopo login, ciascuno atterra su una destinazione ammessa per il proprio ruolo.

**Blocked by:** 12 — Capture product context with Impeccable init

**Status:** claimed

- [ ] Account Dipendente su URL Admin → blocco (redirect o errore chiaro)
- [ ] Server action / mutazioni Admin non eseguibili da Dipendente
- [ ] Post-login atterraggio role-aware
- [ ] Amministratore raggiunge tutte le aree previste

**Source:** `docs/.scratch/dashboard-data-ux/issues/02-rbac-landing.md`

Usare skill /impeccable (critique/harden/polish sulla shell auth).

## Comments

- 2026-07-23 — claimed by implement loop (cloud)
