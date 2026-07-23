# 01 — Migrate + reset DB al nuovo schema Prisma

**What to build:** Il database live e il Prisma Client coincidono con lo `schema.prisma` già aggiornato (surrogate PK su Acquisto/Ingresso, Ingresso→Acquisto obbligatorio, niente `remainingEntrances` / `tipo` su Acquisto-Listino, Decimal sui soldi, Restrict sulle FK). Per DB di corso/dev è accettabile reset + re-seed: l’app può restare rotta finché non arrivano i ticket successivi.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Migration generata dallo schema target applicata (o reset equivalente) senza errori
- [x] `prisma generate` lascia un client coerente con lo schema
- [x] Verificato che le colonne/relazioni obsolete non esistano più nel DB (es. `clienti.ingressi_rimanenti`, `acquisti.tipo`, `listini.tipo`, PK composite vecchie su ingressi)
- [x] Nessun redesign ER: solo allineamento DDL allo schema già deciso

## Notes (agent)

- No prior `prisma/migrations/` — created baseline migration `20260721233000_align_to_updated_schema` via `prisma migrate diff --from-empty --to-schema-datamodel`.
- Applied with `npx prisma migrate reset --force` (course/dev DB; data wiped).
- `npx prisma generate` OK (also ran during reset).
- Verified with `prisma db pull --print`: no `ingressi_rimanenti`; `acquisti`/`listini` have no `tipo`; `ingressi` uses surrogate `id` PK + `id_acquisto` FK (not old composite PK). Remaining `tipo` only on `contratti` / `pagamenti` (intentional).
