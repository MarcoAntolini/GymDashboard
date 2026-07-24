# 39 — Loading, error, and empty states on entity shell

**What to build:** La shell condivisa gestisce caricamento, fallimento fetch e lista vuota: niente spinner infinito, empty actionable, errore con retry.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting; 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** resolved

## Comments

- 2026-07-24 — claimed by implement loop (cloud)

- [x] Fetch fallito → errore + retry (niente spinner infinito)
- [x] Loading coerente sulla shell condivisa
- [x] Empty dataset spiega la prossima azione
- [x] Empty da filtri distinto da empty dataset

**Source:** `docs/.scratch/dashboard-data-ux/issues/07-loading-error-empty-states.md`

## Done

- Shared `useEntityListFetch` lifecycle (`loading` / `success` / `error` + `retry` / `refresh`) wired on all entity list pages.
- `ServerDataTable` owns in-slot loading (`ListShellLoading`) and error + **Riprova** (`ListShellError`); Dashboard chrome stays mounted; refetch keeps prior rows with muted opacity / banner retry.
- Dataset vs filters empty copy kept via `emptyKind` + expanded `DATASET_EMPTY_MESSAGES` (actionable IT next-step for Abbonamenti, Pacchetti, Dipendenti, Account, Timbrature, …).
- Impeccable Assessment A: P0 failed-fetch + shared loading contract fixed; deferred P1 inline “Resetta filtri” CTA on filters-empty (copy already points to reset/Filtra).
- Tests: `src/lib/format/table-empty.test.ts` (empty kinds + fetch error copy).
