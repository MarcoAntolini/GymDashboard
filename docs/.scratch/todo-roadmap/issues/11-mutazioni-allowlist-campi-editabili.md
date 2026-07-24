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

- 2026-07-24 claimed by implement loop

## Done

- Matrice entità → campo → create|update|immutable|Admin-only|write-only (+ strip join) in `src/lib/domain/mutation-allowlist.ts` e `docs/domain/05-mutazioni-allowlist.md`.
- `assertMutationPayload` in tutte le create/edit `src/data-access`: reject snapshot/derived/immutable; strip join di lettura; password write-only reject su update.
- `editAccount`: solo role/approved + `requireAdminActor()` (`src/lib/auth/require-admin.ts`); page accounts pick campi allowlist.
- Casi limite documentati: cambio productCode → re-snapshot; endingDate OpenEnded/FixedTerm; password Account.
- Smoke: `npx tsx scripts/verify-mutation-allowlist.ts` verde.
- Deferral: RBAC ampio su tutta la superficie → ticket 13; maschera password in lettura → 15; self-service password → 17.