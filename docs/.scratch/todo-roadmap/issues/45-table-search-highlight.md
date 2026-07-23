# 45 — Search highlight (con ricerca backend)

**What to build:** Con la ricerca lato server, i match nella pagina corrente sono evidenziati. Ha senso proprio perché la search non è più un filtro client su tutto il dataset.

**Blocked by:** 20 — Clienti; 21 — Ingressi; 22 — Acquisti; 23 — Prodotti; 24 — Abbonamenti; 25 — Pacchetti ingressi; 26 — Listino; 27 — Dipendenti; 28 — Account; 29 — Contratti; 30 — Timbrature; 31 — Stipendi; 32 — Bollette; 33 — Attrezzatura; 34 — Interventi; 35 — Pagamenti

**Status:** ready-for-agent

- [ ] Ricerca testuale passa dal contratto liste server-side
- [ ] Highlight dei match nelle celle della pagina corrente
- [ ] Nessun highlight fuorviante su dati non nella page caricata
- [ ] Funziona almeno sulle liste core (Clienti, Ingressi, Acquisti, Dipendenti, Account) e idealmente su tutte
