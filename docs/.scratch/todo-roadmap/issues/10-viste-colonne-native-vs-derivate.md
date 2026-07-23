# 10 — Viste: colonne native vs derivate

**What to build:** Per ogni vista lista/dettaglio, ogni colonna è classificata: nativa, join/label, derivata/aggregata, snapshot storico. Le derivate non vengono inventate come colonne persistite sulla tabella sbagliata.

**Blocked by:** 02 — Snapshot durata e N ingressi su Acquisto

**Status:** claimed

- [ ] Esiste una matrice entità → colonna → classe (nativa | join | derivata | snapshot) per le viste CRUD principali
- [ ] Nessun attributo falso persistito solo per la UI (es. residuo sul Cliente)
- [ ] Liste/dettaglio espongono join e derivate dove servono; in UI/DTO sono distinguibili da quelle native
- [ ] Audit delle pagine/DTO attuali: violazioni corrette o documentate con motivo

## Comments

- 2026-07-23 21:53 UTC — claimed by implement loop (cloud, branch ticket-loop)

**Source:** `docs/.scratch/data-policy/issues/22-viste-colonne-native-vs-derivate.md`
