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

- 2026-07-24 — claimed by implement loop (cloud)
- Critique Impeccable (Assessment A+B): P0 payment type orphan, missing submit loading, delete AlertDialogAction auto-close; P1 edit Dialog→Sheet, EN chrome, empty create guidance, Restrict copy.

## Done

- Shared create shell (`dashboard.tsx`): Dialog + submit loading (`Loader2`), toast success/error, no close while submitting / on failure; `createHint` for pages without local create.
- Shared row actions (`table-item-actions.tsx`): edit → Sheet; delete confirm stays open until success (`Button` instead of auto-closing `AlertDialogAction`); IT domain copy + optional Restrict `deleteConsequence`; `entityLabel` on all list columns.
- Pagamento: tipo locked on edit (UI + `assertPaymentTypeUnchanged` in `editPayment`); specialty remains create-only.
- Stipendi/Bollette/Attrezzatura/Interventi/Prodotti: toolbar + empty-state guidance pointing to Pagamenti or Abbonamenti/Pacchetti.
- Tests: `payment-edit.test.ts`, `create-guidance.test.ts`.
- Deferred: full Italianization of every create-form field label (ticket 47); live browser Restrict smoke against DB (ticket 38/09 paths already map toast messages).
