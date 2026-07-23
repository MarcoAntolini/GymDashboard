# 19 — Fondamenta liste server-side (filtri Conferma, sort, paginazione)

**What to build:** Esiste un contratto condiviso data-access + pattern UI per liste: filtri applicati solo su Conferma/Filtra (niente query a ogni keystroke), cambio ordinamento colonna riesegue la query con ORDER BY, paginazione server-side (LIMIT/OFFSET o cursore). Nessuna tabella entity migrata end-to-end in questo ticket (solo fondamenta riusabile).

**Blocked by:** 10 — Viste: colonne native vs derivate; 11 — Mutazioni: allowlist campi editabili; 03 — Clienti senza ingressi rimanenti persistiti; 04 — Listino senza tipo, chiave composta, Decimal; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso; 07 — Contratti senza intervalli sovrapposti

**Status:** ready-for-agent

- [ ] API/helper condiviso per list query: filtri + sort + page + pageSize + total count
- [ ] Pattern UI: controlli filtro con azione Conferma/Filtra esplicita
- [ ] Cambio sort colonna → nuova query DB (non sort solo-pagina client)
- [ ] Paginazione server-side documentata e riusabile
- [ ] Indici candidati per WHERE/ORDER BY frequenti considerati (allineamento a docs/db-guidelines/16-indici.md)
- [ ] Nessuna migrazione completa di una tabella entity richiesta qui (i ticket 20–35 la fanno)
