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

- 2026-07-24 — claimed by implement loop

## Done

- Allineato `prisma/schema.prisma` a `docs/domain/03-schema-logico.md` (lo schema nel repo era ancora il modello precedente).
- Baseline migration `20260724170000_align_to_updated_schema` generata con `prisma migrate diff --from-empty` e applicata con `prisma migrate reset --force` (DB corso/dev wipe).
- `prisma generate` OK; client coerente con Decimal, Restrict, PK surrogate.
- Verificato con `prisma db pull --print`: niente `ingressi_rimanenti`; niente `tipo` su `acquisti`/`listini`; `ingressi` con `id` + `id_acquisto`; soldi in `DECIMAL(10,2)`.
- Deferral esplicito: CRUD/app e seed restano da allineare nei ticket successivi (02+); snapshot durata/N su Acquisto è ticket 02.
