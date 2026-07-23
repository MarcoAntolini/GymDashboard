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

- 2026-07-23 — claimed by ticket-loop cloud worker

## Done

- Added Prisma `Role.Owner` (`Proprietario`) + migration; session/`AppRole`/`roleAllows` inherit Owner > Admin > Employee.
- Hierarchy helpers (`canManageRole`, `assignableRoles`, `assertAccountRoleMutation`) enforce strict-inferior management; Owner never assignable via app (DB-only).
- `editAccount` / `deleteAccount` load target role and reject peer/superior touches with 403; Admin cannot manage Admin/Owner.
- Accounts UI: role Select limited to assignable roles; edit/delete disabled for peers/superiors; no Owner option in Admin UI.
- Tests: `nav-routes`, `account-role-hierarchy`, session Owner round-trip; `scripts/smoke-rbac.mjs` updated.
