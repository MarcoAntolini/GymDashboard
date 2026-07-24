# 17 — Profilo self-service (anagrafica, foto locale, credenziali)

**What to build:** Ogni Dipendente con Account (qualsiasi ruolo) gestisce il proprio profilo: foto (storage locale), nome, cognome, email, telefono, ecc., più username e password. La modifica password richiede la password attuale. Nessuno può cambiare le credenziali di altri. Voce nel dropdown profilo in navbar.

**Blocked by:** 11 — Mutazioni: allowlist campi editabili; 13 — RBAC Admin/Employee + landing role-aware

**Status:** resolved

- [x] Voce Profilo nel dropdown utente in navbar apre la gestione profilo
- [x] Update anagrafica self sul Dipendente collegato all'Account corrente
- [x] Upload/sostituzione foto profilo con storage locale sotto il progetto
- [x] Cambio username/password self; cambio password richiede password corrente
- [x] Server rifiuta aggiornamento credenziali di un altro Account

## Comments

- 2026-07-24 21:52 — claimed by implement loop

## Done

- Voce **Profilo** nel dropdown navbar apre uno Sheet dedicato (`ProfileSheet` in layout dashboard).
- Server actions `getOwnProfile` / `updateOwnEmployeeProfile` aggiornano solo il Dipendente legato all'Account in sessione (allowlist employee).
- Upload foto via `POST /api/profile/photo` su `public/uploads/profiles/{employeeId}.{ext}` (gitignored, `.gitkeep` in repo).
- `updateOwnCredentials`: cambio password richiede password attuale + bcrypt; username/password solo self; reject se `username` ≠ sessione; re-issue cookie se username cambia.
- Smoke: `node scripts/smoke-profile-self-service.mjs`.
