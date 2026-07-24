# 41 — Leggibilità tabelle + form (icone, chip/badge, date, numeri)

**What to build:** Migliora la leggibilità operativa: header con icona muted e chrome uniforme; chip per categorie vs badge per stati; semantica colore fissa; date con mese abbreviato; numeri (prezzi/quantità, non id) allineati a destra; stessi pattern in create/edit. Densità da strumento, no hero metric.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting; 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** claimed

- [ ] Header colonne: icona muted + stesso chrome (anche non-sortable)
- [ ] Categorie = chip outline+dot; stati azionabili = badge soft+icona; etichetta sempre presente
- [ ] Semantica colore riusata (entrate/success, uscite/danger, warning, info)
- [ ] Date in locale con mese abbreviato testuale
- [ ] Colonne numeriche (non id) allineate a destra
- [ ] Stessi pattern visivi nei form create/edit; componenti riusabili; contrasto AA light/dark

Usare skill /impeccable e /shadcn.
