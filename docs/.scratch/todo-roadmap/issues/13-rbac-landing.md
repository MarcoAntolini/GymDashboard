# 13 - RBAC Admin/Employee + landing role-aware

**What to build:** Un Dipendente autenticato non puo aprire route ne eseguire azioni riservate all'Amministratore. Dopo login, ciascuno atterra su una destinazione ammessa per il proprio ruolo.

**Blocked by:** 12 - Capture product context with Impeccable init

**Status:** resolved

- [x] Account Dipendente su URL Admin -> blocco (redirect o errore chiaro)
- [x] Server action / mutazioni Admin non eseguibili da Dipendente
- [x] Post-login atterraggio role-aware
- [x] Amministratore raggiunge tutte le aree previste

**Source:** `docs/.scratch/dashboard-data-ux/issues/02-rbac-landing.md`

Usare skill /impeccable (critique/harden/polish sulla shell auth).

## Comments

- 2026-07-24 - claimed by implement loop

## Done

- Session HMAC include ruolo `r`; login e middleware usano landing role-aware (Admin `/accounts`, Dipendente `/entrances`).
- SoT path->ruolo in `src/data/nav-routes.ts`; middleware blocca URL Admin per Dipendente con redirect a `/forbidden?from=`.
- `requireSession` / `requireRole` / `requireAdminActor` in `src/lib/auth.ts`; moduli Admin (accounts/employees/contracts/clockings/salaries) gated; register/login restano aperti senza sessione.
- Pagina `/forbidden` con copy IT + CTA verso landing del ruolo (harden/polish Impeccable su recovery auth).
- Smoke: `node scripts/smoke-rbac.mjs`.
- Deferred: glossario EN in nav/login (ticket 18/47); ruolo Owner (ticket 14); Panoramica `/` come home (ticket 51).