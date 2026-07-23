# 09 — Liste DB: Pagamenti (+ guadagni periodo)

**What to build:** Pagamenti filtrano per tipo e ricercano il “detail” via predicati sulle specializzazioni (non stringa concatenata solo-client). Lo sheet guadagni Contratti resta coerente se il periodo è ristretto o adotta lo stesso ListQuery.

**Blocked by:** 05 — Expand: ListQuery + DataTable server-mode + pilota Clienti

**Status:** ready-for-agent

- [ ] `/payments` lista DB: faceted su tipo Pagamento; search detail decomposta su relazioni (Bolletta/Attrezzatura/Intervento/Stipendio)
- [ ] Nessun filtro solo-client sul dataset completo Pagamenti
- [ ] Sheet guadagni: o resta su dataset già limitato per periodo, o usa lista DB — documentato e verificabile
