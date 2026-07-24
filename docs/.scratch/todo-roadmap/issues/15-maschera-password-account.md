# 15 — Maschera password in tabella Account

**What to build:** Nella tabella Account la password non è mostrata in chiaro: asterischi (o equivalente) e pulsante per rivelare la singola riga. Resta write-only nelle mutazioni (nessun edit “libero” della password altrui).

**Blocked by:** 11 — Mutazioni: allowlist campi editabili

**Status:** resolved

- [x] Colonna password mascherata di default in lista Account
- [x] Azione per mostrare/nascondere la password della singola riga
- [x] Nessuna esposizione accidentale oltre al reveal esplicito
- [x] Coerente con allowlist write-only del ticket 11 (maschera UI, non redesign auth/hash)

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Aggiunto `MaskedPasswordCell` in `accounts/columns.tsx`: default `••••••••`, reveal/hide per riga con Eye/EyeOff.
- Stato reveal locale alla cella (non apre altre password).
- Nessun redesign auth/hash; edit sheet resta senza campo password; allowlist write-only del ticket 11 invariata.
- Deferral: eventuale hashing lato create Account resta fuori scope.
