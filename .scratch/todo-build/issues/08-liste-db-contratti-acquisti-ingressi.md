# 08 — Liste DB: Contratti, Acquisti, Ingressi

**What to build:** Contratti, Acquisti e Ingressi filtrano su join/derivati (Dipendente, Cliente, Prodotto, tipo) lato DB; residuo/validità Ingressi coerenti con lo snapshot Acquisto.

**Blocked by:** 05 — Expand: ListQuery + DataTable server-mode + pilota Clienti; 01 — Snapshot durata e N ingressi su Acquisto

**Status:** ready-for-agent

- [ ] `/contracts`, `/purchases`, `/entrances` lista DB con filtri su colonne derivate mappate a relation filters
- [ ] Search “Cliente”/“Dipendente” = OR su nome/cognome (e regole id numeriche se definite)
- [ ] Colonne derivate di sola lettura (es. residuo) non sono editabili via filtro UI come se fossero campi nativi
