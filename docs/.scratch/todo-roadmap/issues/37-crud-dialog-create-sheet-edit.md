# 37 — CRUD: Dialog create / Sheet edit + feedback

**What to build:** Create usa Dialog; edit usa Sheet. Create/modifica/eliminazione prevedibili: loading su submit, niente chiusura su fallimento, copy di dominio, specializzazioni Pagamento coerenti.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting

**Status:** resolved

- [x] Create entity apre Dialog; edit apre Sheet (shadcn/ui)
- [x] Feedback errore create/edit/delete coerente
- [x] Submit con loading; superficie non chiude su fallimento
- [x] Se create non è locale, UI indica dove creare
- [x] Copy dialog/sheet/confirm in linguaggio di dominio (Restrict incluso)

**Source:** `docs/.scratch/dashboard-data-ux/issues/05-crud-actions-feedback.md` (più decisione Dialog/Sheet).

Usare skill /impeccable e /shadcn.

## Comments

- 2026-07-28 — claimed by implement loop

## Done

- Create resta su Dialog (`Dashboard`); edit passa a Sheet (`ItemActions`); delete resta su AlertDialog.
- Submit create/edit/delete con loading + toast errore coerente (sonner); superfici non chiudono su fallimento.
- `CreateElsewhereHint` + empty-state aggiornati su Stipendi/Bollette/Attrezzatura/Interventi/Prodotti.
- Pagamento: tipo bloccato in edit (UI + `editPayment`); create Dialog con copy di dominio.
- Copy delete con messaggi Restrict su Cliente/Prodotto/Acquisto; `entityLabel` su tutte le liste.
- Commit: `69ceb9d149c81dec4964aea4c94bfc87714456d1`
- Deferral: Italianizzazione completa etichette create form fuori Pagamenti → ticket 47; smoke browser Restrict live vs DB → deferred.
