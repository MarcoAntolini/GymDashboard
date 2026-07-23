# 07 — Contratti senza intervalli sovrapposti

**What to build:** L’operatore non può creare o aggiornare un Contratto il cui intervallo [startingDate, endingDate) si sovrappone a un altro Contratto dello stesso Dipendente (endingDate null = infinito).

**Blocked by:** 01 — Migrate + reset DB al nuovo schema Prisma

**Status:** ready-for-agent

- [ ] Create Contratto con overlap sullo stesso Dipendente → reject
- [ ] Update Contratto che introdurrebbe overlap → reject
- [ ] Intervallo aperto (endingDate null) trattato come +∞
- [ ] Contratti adiacenti half-open ammessi vengono salvati

**Source:** `docs/.scratch/align-prisma-app/issues/06-contratti-no-overlap.md`
