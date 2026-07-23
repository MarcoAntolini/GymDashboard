# 05 — Expand: ListQuery + DataTable server-mode + pilota Clienti

**What to build:** Su Clienti, filtri testo, faceted, ordinamento e paginazione funzionano lato DB. Resta disponibile il vecchio caricamento completo per le altre entità non ancora migrate (expand).

**Blocked by:** None — can start immediately.

**Status:** ready-for-agent

- [ ] Esiste un contratto lista condiviso (`ListQuery` / `ListResult`) usabile dalle server action
- [ ] `/clients` filtra, ordina e pagina via DB; search su colonne nominate con predicato parametrizzato
- [ ] Faceted options/counts arrivano dal server, non da tutte le righe in memoria
- [ ] Le altre route lista continuano a funzionare con il path legacy finché non migrate
