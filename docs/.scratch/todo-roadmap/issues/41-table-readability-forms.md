# 41 — Leggibilità tabelle + form (icone, chip/badge, date, numeri)

**What to build:** Migliora la leggibilità operativa: header con icona muted e chrome uniforme; chip per categorie vs badge per stati; semantica colore fissa; date con mese abbreviato; numeri (prezzi/quantità, non id) allineati a destra; stessi pattern in create/edit. Densità da strumento, no hero metric.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting; 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** resolved

- [x] Header colonne: icona muted + stesso chrome (anche non-sortable)
- [x] Categorie = chip outline+dot; stati azionabili = badge soft+icona; etichetta sempre presente
- [x] Semantica colore riusata (entrate/success, uscite/danger, warning, info)
- [x] Date in locale con mese abbreviato testuale
- [x] Colonne numeriche (non id) allineate a destra
- [x] Stessi pattern visivi nei form create/edit; componenti riusabili; contrasto AA light/dark

Usare skill /impeccable e /shadcn.

## Comments

- 2026-07-24 — claimed by implement loop (cloud); continuing after claim-only push.

## Done

- Shared chrome: `TableSortableHeader` accepts muted Lucide `icon` + uniform h-8 header for sortable and non-sortable columns; numeric headers `align="right"`.
- Tokens + components: `--success` / `--warning` / `--info` in `globals.css` + Tailwind; `DotBadge` (category outline+dot), `DomainBadge` (soft status+icon), `MoneyTone` (income/expense/signed); helpers in `domain-visuals.ts`.
- Wired on core lists (Pagamenti, Acquisti, Contratti, Account, Ingressi, Listino, Clienti, …): type/role chips, approval/residuo status badges, EUR right-aligned with money direction colors, IT abbreviated dates.
- Forms create/edit reuse the same chips/badges, `formatDateIt` on date triggers, and `text-right tabular-nums` on amount/quantity inputs.
- Tests: `domain-visuals.test.ts` + existing `locale.test.ts` green. Deferred: full EN→IT label sweep (ticket 47), earnings period picker still uses date-fns `LLL dd, y`.
