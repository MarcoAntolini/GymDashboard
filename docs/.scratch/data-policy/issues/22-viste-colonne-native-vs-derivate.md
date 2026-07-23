# 22 — Viste: colonne native vs derivate

**What to build:** Per ogni vista lista/dettaglio, ogni colonna è classificata e allineata a schema/query: **nativa** (attributo della relazione dell’entità), **join/label** (dato di un’altra tabella mostrato per leggibilità), **derivata/aggregata** (calcolo/query, es. Ingressi rimanenti), **snapshot storico** (fatto memorizzato alla vendita, es. importo/durata/N su Acquisto). Le derivate non vengono inventate come colonne persistite sulla tabella sbagliata; le join/proiezioni restano lato query, coerenti con db-guidelines e con la proposta operativa.

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Esiste una matrice entità → colonna → classe (`nativa` | `join` | `derivata` | `snapshot`) per le viste CRUD principali
- [ ] Nessun attributo “falso” persistito solo per la UI (es. residuo ingressi sul Cliente); le derivate restano proiezione/aggregato
- [ ] Liste/dettaglio espongono join e derivate dove servono all’operatore; in UI/DTO sono distinguibili da quelle native
- [ ] Audit delle pagine/DTO attuali: violazioni corrette o documentate con motivo
- [ ] Allineamento esplicito a snapshot Acquisto (ticket 01) e a filtri su join/derivati (ticket 08) come casi della stessa policy
