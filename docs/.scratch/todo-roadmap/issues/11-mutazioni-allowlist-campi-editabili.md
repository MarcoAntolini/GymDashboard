# 11 — Mutazioni: allowlist campi editabili

**What to build:** Per ogni entità, create/update accettano solo campi che ha senso modificare. Derivati e join non entrano nel payload; snapshot immutabili; password write-only; ruolo/Approvazione solo Admin+.

**Blocked by:** 10 — Viste: colonne native vs derivate

**Status:** ready-for-agent

- [ ] Matrice entità → campo → create | update | immutable | Admin-only | write-only
- [ ] Campi derivata/join esclusi dai payload di mutazione
- [ ] Snapshot e fatti storici non editabili come campi liberi, salvo eccezione documentata
- [ ] Server actions / data-access rifiutano campi fuori allowlist
- [ ] Casi limite documentati (cambio Prodotto su Acquisto, DataFine Contratto, password Account)

**Source:** `docs/.scratch/data-policy/issues/23-mutazioni-allowlist-campi-editabili.md`
