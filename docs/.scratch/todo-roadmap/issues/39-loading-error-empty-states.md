# 39 — Loading, error, and empty states on entity shell

**What to build:** La shell condivisa gestisce caricamento, fallimento fetch e lista vuota: niente spinner infinito, empty actionable, errore con retry.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting; 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** claimed

## Comments

- 2026-07-24 — claimed by implement loop (cloud)

- [ ] Fetch fallito → errore + retry (niente spinner infinito)
- [ ] Loading coerente sulla shell condivisa
- [ ] Empty dataset spiega la prossima azione
- [ ] Empty da filtri distinto da empty dataset

**Source:** `docs/.scratch/dashboard-data-ux/issues/07-loading-error-empty-states.md`
