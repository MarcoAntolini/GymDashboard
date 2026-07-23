# 10 — Contract: rimuovere filtri/paginazione solo-client

**What to build:** Dopo la migrazione delle liste, il path legacy di filtro/paginazione in-memory non resta attivo sulle route migrate; `getAll*` non più usate dalle liste sono rimosse o deprecate in modo chiaro.

**Blocked by:** 06 — Liste DB: Dipendenti + Listino; 07 — Liste DB: Timbrature, Account e uscite tipizzate; 08 — Liste DB: Contratti, Acquisti, Ingressi; 09 — Liste DB: Pagamenti (+ guadagni periodo)

**Status:** ready-for-agent

- [ ] Route lista migrate usano solo modalità server (manual pagination/filtering)
- [ ] Nessun `getFilteredRowModel` / facet da tutte le righe caricate sulle liste migrate
- [ ] Dead code `getAll*` delle liste migrate rimosso o non più chiamato dal path UI lista
