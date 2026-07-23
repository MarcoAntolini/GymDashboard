# 17 — Profilo self-service (anagrafica, foto locale, credenziali)

**What to build:** Ogni Dipendente con Account (qualsiasi ruolo) gestisce il proprio profilo: foto (storage locale), nome, cognome, email, telefono, ecc., più username e password. La modifica password richiede la password attuale. Nessuno può cambiare le credenziali di altri. Voce nel dropdown profilo in navbar.

**Blocked by:** 11 — Mutazioni: allowlist campi editabili; 13 — RBAC Admin/Employee + landing role-aware

**Status:** claimed

- [ ] Voce Profilo nel dropdown utente in navbar apre la gestione profilo
- [ ] Update anagrafica self sul Dipendente collegato all’Account corrente
- [ ] Upload/sostituzione foto profilo con storage locale sotto il progetto
- [ ] Cambio username/password self; cambio password richiede password corrente
- [ ] Server rifiuta aggiornamento credenziali di un altro Account
