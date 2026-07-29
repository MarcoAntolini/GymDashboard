# 49 — Calcola guadagni: dati Dipendente in vista

**What to build:** Nella vista “calcola guadagni” dei Dipendenti compaiono nome e altri dati utili del Dipendente, non solo identificatori opachi.

**Blocked by:** 36 — Core entity tables: colonne, filtri, formatting

**Status:** resolved

- [x] Vista calcola guadagni mostra nome (e dati anagrafici utili) del Dipendente
- [x] Allineata al glossario e al formatting IT delle altre viste

## Done

- `getEmployeesEarningsInPeriod` include anagrafica Dipendente (`name`, `surname`, `taxCode`, `id`) via join Prisma.
- Sheet “Calcola guadagni”: colonna **Dipendente** con `formatPersonLabel` (come Contratti/Timbrature/Stipendi) al posto del solo ID opaco.
- Aggiunta colonna **CF** e filtri toolbar su Dipendente/CF con etichette IT.
- Tipo `endingDate` allineato a `Date | null` (contratti indeterminati).
