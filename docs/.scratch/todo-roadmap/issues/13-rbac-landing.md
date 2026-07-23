# 13 — RBAC Admin/Employee + landing role-aware

**What to build:** Un Dipendente autenticato non può aprire route né eseguire azioni riservate all’Amministratore. Dopo login, ciascuno atterra su una destinazione ammessa per il proprio ruolo.

**Blocked by:** 12 — Capture product context with Impeccable init

**Status:** resolved

- [x] Account Dipendente su URL Admin → blocco (redirect o errore chiaro)
- [x] Server action / mutazioni Admin non eseguibili da Dipendente
- [x] Post-login atterraggio role-aware
- [x] Amministratore raggiunge tutte le aree previste

**Source:** `docs/.scratch/dashboard-data-ux/issues/02-rbac-landing.md`

Usare skill /impeccable (critique/harden/polish sulla shell auth).

## Comments

- 2026-07-23 — claimed by implement loop (cloud)
- 2026-07-23 — implemented by implement loop (cloud)

## Done

- Session HMAC payload includes role `r`; login/middleware landings use `landingPathForRole` (Admin → `/accounts`, Employee → `/entrances`).
- Edge-safe `src/data/nav-routes.ts` + middleware path→role checks; insufficient role → `/forbidden?from=…` with Italian recovery + logout “Cambia Account”.
- `requireSession` / `requireRole` / `requireRoleUnlessPublic` in `src/lib/auth.ts`; Admin DA modules gated Admin; Employee modules gated Employee+; register/login helpers stay public.
- Nav filters via shared `roleAllows`; smoke `node scripts/smoke-rbac.mjs`; unit tests for nav-routes + session role.
- Impeccable critique (dual assessment): P0 none remaining; hardened forbidden switch-account; deferred P1 shell role badge + login validation policy (out of ticket AC / ticket 18+).
