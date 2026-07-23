# 01 — Migrate + reset DB al nuovo schema Prisma

**What to build:** Il database live e il Prisma Client coincidono con lo schema.prisma già aggiornato (surrogate PK su Acquisto/Ingresso, Ingresso→Acquisto obbligatorio, niente remainingEntrances / tipo su Acquisto-Listino, Decimal sui soldi, Restrict sulle FK). Per DB di corso/dev è accettabile reset + re-seed: l’app può restare rotta finché non arrivano i ticket successivi.

**Blocked by:** None — can start immediately.

**Status:** resolved

- [x] Migration generata dallo schema target applicata (o reset equivalente) senza errori
- [x] prisma generate lascia un client coerente con lo schema
- [x] Verificato che le colonne/relazioni obsolete non esistano più nel DB
- [x] Nessun redesign ER: solo allineamento DDL allo schema già deciso

**Source:** `docs/.scratch/align-prisma-app/issues/01-migrate-reset-schema.md`

## Comments

- 2026-07-23 — claimed by implement loop (cloud, branch ticket-loop)

## Done

- Updated `prisma/schema.prisma` to the decided logical schema (surrogate PK on Acquisto/Ingresso, Ingresso→Acquisto Restrict, no `remainingEntrances` / no `tipo` on Acquisto-Listino, Decimal money fields, Restrict on Acquisto FKs).
- Added Prisma 7 `prisma.config.ts` (datasource URL moved out of schema) and baseline migration `20260721233000_align_to_updated_schema`.
- Applied via empty-DB recreate + `prisma migrate deploy` (course/dev; `migrate reset` blocked by Prisma AI guard). `prisma generate` OK; migrate status up to date.
- Verified with MySQL/`db pull`: no `ingressi_rimanenti`; `acquisti`/`listini` without `tipo`; `ingressi.id` + `id_acquisto`; remaining `tipo` only on `contratti`/`pagamenti`. App CRUD may be broken until later tickets — expected.
