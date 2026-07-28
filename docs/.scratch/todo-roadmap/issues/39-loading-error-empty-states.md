# 39 — Loading, error, and empty states on entity shell

**What to build:** La shell condivisa gestisce caricamento, fallimento fetch e lista vuota: niente spinner infinito, empty actionable, errore con retry.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting; 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** resolved

- [x] Fetch fallito → errore + retry (niente spinner infinito)
- [x] Loading coerente sulla shell condivisa
- [x] Empty dataset spiega la prossima azione
- [x] Empty da filtri distinto da empty dataset

**Source:** `docs/.scratch/dashboard-data-ux/issues/07-loading-error-empty-states.md`

## Comments

- 2026-07-28 — claimed by implement loop

## Done

- `DataTable` gestisce `isLoading` / `error`+`onRetry` / empty dataset vs empty da filtri (`appliedFilters` + default “Reimposta filtri”).
- Nuovi stati condivisi: `TableLoadingState`, `TableErrorState`; `TableEmptyState` supporta CTA opzionale.
- Tutte le pagine lista entità: shell sempre montata (niente `DashboardPlaceholder` su first-load lista); empty copy solo dataset (create / create-elsewhere), senza confondere con i filtri.
- Accounts: placeholder solo finché manca `actorRole`; poi stessa shell stati lista.
- Commit: `87b086a`
- Deferral: critique Impeccable formale non eseguito in browser; stati allineati a pattern densità operativa già in repo (P0 AC soddisfatti). `useEntityData` secondario fuori scope.
