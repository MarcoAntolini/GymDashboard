# 15 — Maschera password in tabella Account

**What to build:** Nella tabella Account la password non è mostrata in chiaro: asterischi (o equivalente) e pulsante per rivelare la singola riga. Resta write-only nelle mutazioni (nessun edit “libero” della password altrui).

**Blocked by:** 11 — Mutazioni: allowlist campi editabili

**Status:** claimed

- [ ] Colonna password mascherata di default in lista Account
- [ ] Azione per mostrare/nascondere la password della singola riga
- [ ] Nessuna esposizione accidentale oltre al reveal esplicito
- [ ] Coerente con allowlist write-only del ticket 11 (maschera UI, non redesign auth/hash)

## Comments

- 2026-07-23 — claimed by ticket-loop cloud worker
