# 48 — Mock data realistici IT + seed Owner

**What to build:** Il generatore mock produce dati realistici e italiani (nomi, indirizzi, telefoni, testi). Genera anche un Owner con username owner e password Password1.

**Blocked by:** 09 — Seed ordinato + Restrict/Decimal smoke; 14 — Ruolo Owner + gerarchia

**Status:** resolved

- [x] Mock data con locale/contenuti italiani e coerenza di dominio
- [x] Seed/mock crea Account Owner con username owner e password Password1
- [x] Dati usabili per testare filtri, analytics e flussi Operazioni
- [x] Niente dataset americani di default nel generatore

## Comments

- 2026-07-28 — claimed by implement loop

## Done

- Entrypoint unico `src/lib/mocks/faker.ts` (`fakerIT`); tutti i mock importano da lì, non dal default en.
- Helper IT (`italian.ts`): province, telefoni `+39`, CF fittizio, testi/fornitori palestra, codici prodotto `ABB/PAC/CRT/FIT`.
- `mockAccounts`: primo dipendente → `Role.Owner` con login `owner` / `Password1`; altri Admin/Employee.
- Listino su anni recenti + acquisti nell’ultimo anno (prezzi collegabili per filtri/analytics).
- Smoke: `node scripts/smoke-mock-italian.mjs` verde (locale + Owner + no import en). `mockAll` non rieseguito qui (wipe DB).
- Commit: `64190fb`
