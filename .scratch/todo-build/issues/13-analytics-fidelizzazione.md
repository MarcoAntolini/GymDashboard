# 13 — Analytics: fidelizzazione proxy

**What to build:** Indicatori OLTP di fidelizzazione: clienti attivi nel periodo, riacquisti/rinnovi, clienti a rischio (nessun Ingresso da N giorni con titolo ancora valido o scaduto di recente). Usa lo snapshot Acquisto per validità/residuo.

**Blocked by:** 01 — Snapshot durata e N ingressi su Acquisto; 11 — Analytics: cassa + mix prodotti

**Status:** ready-for-agent

- [ ] Clienti attivi nel periodo (definizione esplicitata in UI o copy breve)
- [ ] Proxy rinnovo/riacquisto misurabile da Acquisti
- [ ] Lista/conteggio “a rischio” con soglia N giorni documentata
- [ ] Nessun modello ML / LTV predittivo
