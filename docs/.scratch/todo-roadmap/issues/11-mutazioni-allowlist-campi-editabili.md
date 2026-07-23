# 11 — Mutazioni: allowlist campi editabili

**What to build:** Per ogni entità, create/update accettano solo campi che ha senso modificare. Derivati e join non entrano nel payload; snapshot immutabili; password write-only; ruolo/Approvazione solo Admin+.

**Blocked by:** 10 — Viste: colonne native vs derivate

**Status:** resolved

- [x] Matrice entità → campo → create | update | immutable | Admin-only | write-only
- [x] Campi derivata/join esclusi dai payload di mutazione
- [x] Snapshot e fatti storici non editabili come campi liberi, salvo eccezione documentata
- [x] Server actions / data-access rifiutano campi fuori allowlist
- [x] Casi limite documentati (cambio Prodotto su Acquisto, DataFine Contratto, password Account)

**Source:** `docs/.scratch/data-policy/issues/23-mutazioni-allowlist-campi-editabili.md`

## Comments

- 2026-07-23 — claimed by implement loop (cloud); continued from prior claim commit.

## Done

- Added `MUTATION_FIELD_MATRIX` + `assertAllowedMutation` in `src/lib/domain/mutation-fields.ts` (flags: create | update | identity | immutable | admin-only | write-only), aligned with ticket 10 view classes; unit tests in `mutation-fields.test.ts`.
- Wired assert into every `create*` / `edit*` in `src/data-access/*`; page wrappers pick allowlisted keys before DA when list DTOs carry joins.
- Acquisto update no longer accepts `productCode` / `amount` / snapshots; edit UI shows them read-only (`editFormSchema` = clientId + date only).
- Edge cases in `MUTATION_EDGE_CASES`: no product change on existing Acquisto; Contratto `endingDate` via `contract-term.ts`; Account password write-only (ticket 15); role/approved admin-only (RBAC session gate deferred to 13/14).
