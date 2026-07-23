# 17 — Profilo self-service (anagrafica, foto locale, credenziali)

**What to build:** Ogni Dipendente con Account (qualsiasi ruolo) gestisce il proprio profilo: foto (storage locale), nome, cognome, email, telefono, ecc., più username e password. La modifica password richiede la password attuale. Nessuno può cambiare le credenziali di altri. Voce nel dropdown profilo in navbar.

**Blocked by:** 11 — Mutazioni: allowlist campi editabili; 13 — RBAC Admin/Employee + landing role-aware

**Status:** resolved

- [x] Voce Profilo nel dropdown utente in navbar apre la gestione profilo
- [x] Update anagrafica self sul Dipendente collegato all’Account corrente
- [x] Upload/sostituzione foto profilo con storage locale sotto il progetto
- [x] Cambio username/password self; cambio password richiede password corrente
- [x] Server rifiuta aggiornamento credenziali di un altro Account

## Comments

- 2026-07-23 — claimed by implement loop (cloud)

## Done

- Navbar user dropdown: voce **Profilo** → `/profile`.
- Self-service DA `src/data-access/profile.ts`: `getOwnProfile`, `updateOwnEmployee`, `changeOwnUsername`, `changeOwnPassword`, `uploadOwnPhoto` — scoped to session; foreign `targetUsername` / `employeeId` → 403.
- Password change requires current password (`assertPasswordChangeAllowed` + bcrypt verify); Admin allowlist still rejects password on Account update.
- Foto locale in `public/uploads/profiles/{employeeId}.{ext}` (jpg/png/webp, max 2 MB); middleware excludes uploads/images.
- Domain helpers + unit tests: `profile-ownership`, `profile-photo`, `password`.
- UI operativa in italiano su `/profile` (anagrafica, credenziali, foto).
