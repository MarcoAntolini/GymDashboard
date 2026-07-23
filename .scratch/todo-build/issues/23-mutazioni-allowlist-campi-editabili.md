# 23 — Mutazioni: allowlist campi editabili

**What to build:** Per ogni entità, create/update accettano solo campi che ha senso modificare nel dominio. Derivati e proiezioni join non entrano mai nel payload; snapshot e fatti di cassa/storico sono immutabili (o cambiano solo con regola esplicita documentata); anagrafica resta editabile; password write-only; ruolo/Approvazione solo Admin. L’allowlist è applicata in data-access/server actions (non solo nascondendo input in UI), coerente con Restrict, snapshot e linee guida DB.

**Blocked by:** 22 — Viste: colonne native vs derivate

**Status:** ready-for-agent

- [ ] Matrice entità → campo → `create` | `update` | `immutable` | `Admin-only` | `write-only`, basata sulla classificazione del ticket 22
- [ ] Campi `derivata` / `join` esclusi dai payload di mutazione
- [ ] Snapshot e fatti storici (es. importo/durata/N Acquisto, identità temporale Ingresso/Timbratura) non editabili come campi liberi, salvo eccezione documentata
- [ ] Server actions / data-access rifiutano campi fuori allowlist; i form non espongono input per quei campi
- [ ] Casi limite documentati (cambio Prodotto su Acquisto esistente, `DataFine` Contratto indeterminato vs determinato, password Account)
