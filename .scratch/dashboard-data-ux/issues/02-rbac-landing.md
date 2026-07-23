# 02 — Role enforcement and role-aware landing

**What to build:** Un Dipendente autenticato non può aprire route né eseguire azioni riservate all’Amministratore (anche via URL diretto). Dopo login, ciascuno atterra su una destinazione ammessa per il proprio ruolo. L’Amministratore mantiene privilegi completi.

**Blocked by:** 01 — Capture product context with Impeccable init

**Status:** done

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs` (dopo ticket 01).
2. `$impeccable critique` sulla shell autenticata / flusso post-login (focus: controllo e libertà, prevenzione errori, stati).
3. Applicare i fix del backlog critique con `$impeccable harden` (auth edges, recovery) e altri comandi Impeccable solo se citati dal critique.
4. Chiudere con `$impeccable polish` sulla surface shell/auth toccata.
5. Verificare manualmente entrambi i ruoli (Amministratore e Dipendente).

## Acceptance criteria

- [x] Un Account con ruolo Dipendente che apre una URL Admin viene bloccato (redirect o errore chiaro), non vede i dati Admin
- [x] Le server action / mutazioni Admin non sono eseguibili da un Dipendente
- [x] Post-login (e redirect da route auth) atterraggio role-aware: non sempre la stessa destinazione Admin-only
- [x] Amministratore continua a raggiungere tutte le aree previste
- [x] Critique Impeccable eseguito e findings P0/P1 di auth/controllo indirizzati o esplicitamente deferred con motivo

## Glossary

Amministratore, Dipendente, Account, Approvazione — da `CONTEXT.md`.

## Implementation notes

### Landing URLs

- **Admin** → `/accounts` (Account / Approvazione; unchanged operational default until overview in ticket 08)
- **Employee (Dipendente)** → `/entrances` (Ingressi — highest-frequency desk task per PRODUCT.md)

### RBAC design

- Source of truth for path → role: `src/data/nav-routes.ts` (edge-safe; `links.ts` adds icons only)
- Session cookie payload now includes role `r` (HMAC-signed) alongside username `u`
- Middleware: unauthenticated → `/auth`; authenticated on `/auth` → role landing; insufficient role → `/forbidden?from=…`
- Server: `requireSession()` / `requireRole()` in `src/lib/auth.ts` guard all data-access server actions (Admin modules vs Employee modules; public register/login helpers stay open when no session)

### Impeccable critique (auth/shell)

⚠️ DEGRADED: single-context (ticket allowed focused single-context critique; dual-agent spawn skipped as subagent)

**P0 (fixed):** Role filtering only in nav — pages/server actions had no enforcement.
**P0 (fixed):** Middleware was auth-only — Admin URLs reachable by URL for Employee.
**P1 (fixed):** Login + auth-route redirect always `/accounts`.
**P1 (fixed):** No recovery surface for blocked access — added `/forbidden` with clear Italian copy + CTA to role landing.
**P2 (deferred):** Login/logout chrome still largely English — ticket 03 owns glossary/label renames; not renaming nav here.
**P2 (accepted):** Role is trusted from signed session for the TTL (1h demo); not re-fetched from DB on every middleware hop.

### Harden / polish applied

- Role-aware redirects; forbidden recovery with `from` context
- Italian copy on blocked-access page (Amministratore / Account / privilegi)
- Nav filter uses shared `roleAllows()` helper
- Smoke: `node scripts/smoke-rbac.mjs` (no vitest/jest in package.json)

### CHANGELOG

No `CHANGELOG.md` in repo — skipped.
