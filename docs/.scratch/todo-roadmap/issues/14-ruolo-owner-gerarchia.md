# 14 — Ruolo Owner + gerarchia (Owner > Admin > Employee)

**What to build:** Esiste il ruolo Owner sopra Admin. Possono esserci più Owner. Ogni ruolo può creare/modificare/promuovere/degradare solo ruoli strettamente inferiori. Gli Admin non gestiscono altri Admin né Owner. L’Owner può nascere da qualsiasi percorso di creazione Account; chi ha accesso al DB gestisce eventuali promozioni a Owner.

**Blocked by:** 11 — Mutazioni: allowlist campi editabili; 13 — RBAC Admin/Employee + landing role-aware

**Status:** resolved

- [x] Enum/ruolo Owner presente in schema, session e RBAC
- [x] Owner gestisce Admin e Dipendente; Admin gestisce solo Dipendente; Dipendente non gestisce ruoli
- [x] UI e server actions rifiutano tentativi di toccare pari grado o superiori
- [x] Più Owner ammessi; nessuna auto-promozione a Owner dall’UI Admin
- [x] Route/azioni riservate Owner (gestione Admin) protette anche via URL diretto

## Comments

- 2026-07-24 — claimed by implement loop

## Done

- Aggiunto `Role.Owner` (`Proprietario`) in Prisma + migration `20260724185000_add_role_owner`.
- Gerarchia Owner > Admin > Employee in `nav-routes` (`roleAllows`, `canManageRole`, `assignableRoles`); landing Owner = Admin (`/accounts`); session/`isAppRole` accettano Owner.
- `requireAdminActor` = Admin+ (Owner|Admin); `requireOwnerActor` + `assertRoleHierarchy` su `editAccount`/`deleteAccount` (promozione a Owner rifiutata dall’app).
- UI Accounts: select ruoli solo assegnabili; Edit/Delete nascosti su pari/superiori.
- Smoke: `node scripts/smoke-rbac.mjs` verde.
- Deferral: seed credenziali `owner`/`Password1` → ticket 48.
