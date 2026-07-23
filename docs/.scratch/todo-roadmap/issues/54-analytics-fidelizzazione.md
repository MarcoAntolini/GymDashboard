# 54 — Analytics: fidelizzazione proxy

**What to build:** Indicatori OLTP: clienti attivi nel periodo, riacquisti/rinnovi, clienti a rischio (nessun Ingresso da N giorni con titolo ancora valido o scaduto di recente). Usa snapshot Acquisto.

**Blocked by:** 02 — Snapshot durata e N ingressi su Acquisto; 52 — Analytics: cassa + mix prodotti

**Status:** ready-for-agent

- [ ] Clienti attivi nel periodo (definizione esplicitata in UI/copy)
- [ ] Proxy rinnovo/riacquisto misurabile da Acquisti
- [ ] Lista/conteggio a rischio con soglia N giorni documentata
- [ ] Nessun modello ML / LTV predittivo

**Source:** `docs/.scratch/analytics/issues/13-analytics-fidelizzazione.md`
