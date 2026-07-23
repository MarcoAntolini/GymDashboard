# 38 — Domain fidelity visible in the UI

**What to build:** L’operatore vede le regole di dominio su Ingressi, Acquisti, Pagamenti e Listino: Ingresso giustificato da Acquisto; residuo per Acquisto; Pagamenti tipizzati; snapshot Listino/Acquisto; Restrict comprensibile.

**Blocked by:** 37 — CRUD: Dialog create / Sheet edit + feedback; 02 — Snapshot durata e N ingressi su Acquisto; 05 — Acquisti: PK surrogata, snapshot importo, niente tipo; 06 — Registrazione Ingresso

**Status:** ready-for-agent

- [ ] Registrazione Ingresso rispetta giustificazione via Acquisto; fallimenti chiari
- [ ] Nessuna UI con ingressi rimanenti persistiti sul Cliente
- [ ] Pagamenti: specializzazione ispezionabile
- [ ] Listino/Acquisto: anno e snapshot comprensibili
- [ ] Delete Restrict spiega il blocco

**Source:** `docs/.scratch/dashboard-data-ux/issues/06-domain-fidelity-ui.md`
