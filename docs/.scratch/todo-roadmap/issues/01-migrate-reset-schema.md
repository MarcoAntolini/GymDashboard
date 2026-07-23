# 01 — Migrate + reset DB al nuovo schema Prisma

**What to build:** Il database live e il Prisma Client coincidono con lo schema.prisma già aggiornato (surrogate PK su Acquisto/Ingresso, Ingresso→Acquisto obbligatorio, niente remainingEntrances / tipo su Acquisto-Listino, Decimal sui soldi, Restrict sulle FK). Per DB di corso/dev è accettabile reset + re-seed: l’app può restare rotta finché non arrivano i ticket successivi.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Migration generata dallo schema target applicata (o reset equivalente) senza errori
- [ ] prisma generate lascia un client coerente con lo schema
- [ ] Verificato che le colonne/relazioni obsolete non esistano più nel DB
- [ ] Nessun redesign ER: solo allineamento DDL allo schema già deciso

**Source:** `docs/.scratch/align-prisma-app/issues/01-migrate-reset-schema.md`
