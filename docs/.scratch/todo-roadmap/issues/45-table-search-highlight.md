# 45 — Search highlight (con ricerca backend)

**What to build:** Con la ricerca lato server, i match nella pagina corrente sono evidenziati. Ha senso proprio perché la search non è più un filtro client su tutto il dataset.

**Blocked by:** 20 — Clienti; 21 — Ingressi; 22 — Acquisti; 23 — Prodotti; 24 — Abbonamenti; 25 — Pacchetti ingressi; 26 — Listino; 27 — Dipendenti; 28 — Account; 29 — Contratti; 30 — Timbrature; 31 — Stipendi; 32 — Bollette; 33 — Attrezzatura; 34 — Interventi; 35 — Pagamenti

**Status:** resolved

- [x] Ricerca testuale passa dal contratto liste server-side
- [x] Highlight dei match nelle celle della pagina corrente
- [x] Nessun highlight fuorviante su dati non nella page caricata
- [x] Funziona almeno sulle liste core (Clienti, Ingressi, Acquisti, Dipendenti, Account) e idealmente su tutte

## Comments

- 2026-07-28 claimed by implement loop

## Done

- Commit: cf7892728f8fb35075aad4fa7d7e711cae8a7295
- Highlight basato su `serverList.appliedFilters` (dopo Filtra), non sui draft: niente match fuorvianti sulla page non ancora refetchata.
- `splitHighlightMatches` + `HighlightText` / `HighlightValueCell`; context `SearchHighlightProvider` in `DataTable`.
- Celle senza `cell` custom: highlight automatico se la chiave colonna ha un filtro stringa/numero applicato (copre Clienti, Dipendenti, username, productCode, provider, ecc.).
- Celle join custom aggiornate: Cliente/Prodotto (Ingressi, Acquisti), Dipendente (Account, Contratti, Timbrature, Stipendi), paymentId/id dove custom.
- Defer: badge/eq faceted (role, approved, tipo) senza wrap highlight; password mascherata non evidenzata.
