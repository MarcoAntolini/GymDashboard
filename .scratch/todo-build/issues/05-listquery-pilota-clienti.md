# 05 — Expand: ListQuery, DataTable server-mode, pilota Clienti

**What to build:** Esiste un’infrastruttura condivisa di lista paginata/filtrata lato DB (`ListQuery` / `ListResult`). La pagina Clienti usa filtri, search, sort e paginazione server-side; le altre entità possono ancora usare il percorso legacy.

**Blocked by:** None — can start immediately.

**Status:** done

- [x] Tipi/validazione condivisi per query lista (page, pageSize, sort, filters)
- [x] `listClients` restituisce items + total (+ facets se usati)
- [x] DataTable/toolbar in modalità server per Clienti (`manualPagination` / filtri controllati)
- [x] Search e filtri faceted Clienti colpiscono il DB, non solo la pagina in memoria
- [x] Le altre route CRUD restano funzionanti con il percorso precedente
