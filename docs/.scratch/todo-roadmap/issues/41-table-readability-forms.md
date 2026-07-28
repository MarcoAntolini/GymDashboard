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

- 2026-07-28 — claimed by implement loop

## Done

- Token CSS `success` / `warning` / `info` (+ dark) in `globals.css` / `tailwind.config.ts`
- Componenti riusabili: `DotBadge`, `DomainBadge`, `MoneyTone`, `NumericCell` (`domain-badge.tsx`); `FormDateField`; `TableSortableHeader` con `icon` + chrome uniforme anche non-sortable
- Colonne entità: chip categoria (tipo pagamento/prodotto/ruolo/contratto), badge stato (approvazione, “In corso”), importi colorati entrate/uscite, numeri `text-right tabular-nums`, icone header
- Form edit: date via `FormDateField` / `formatDateTimeIt` (niente più PPP / `type="date"` inconsistente); campi importo allineati a destra
- Commit: `e93162d`
