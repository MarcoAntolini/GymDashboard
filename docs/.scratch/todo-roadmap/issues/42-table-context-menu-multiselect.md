# 42 — Azioni tabella: context menu + multi-select bulk

**What to build:** Azioni riga anche via context menu shadcn. Multi-select con bulk delete su ogni tabella; dove esistono azioni comuni (es. Approvazione Account) anche quelle in bulk.

**Blocked by:** 37 — CRUD: Dialog create / Sheet edit + feedback; 16 — Coda Approvazione Account

**Status:** resolved

- [x] Context menu shadcn sulle righe tabella per le azioni principali
- [x] Multi-select con selezione multipla usabile
- [x] Bulk delete su ogni tabella lista (con confirm e Restrict feedback)
- [x] Bulk Approvazione (o equivalenti) dove l’azione è comune e ammessa dal ruolo

## Comments

- 2026-07-24 — claimed by implement loop (cloud)

## Done

- Context menu shadcn su ogni riga di `ServerDataTable`: Modifica/Elimina allineati a `ItemActions` via registry per-riga.
- Checkbox column + selezione pagina; barra bulk con conteggio, Annulla selezione, Elimina (AlertDialog).
- Bulk delete su tutte le 16 liste entity: `runBulkDeletes` continua dopo errori Restrict e toast per-riga.
- Account: bulk **Approva** per selezionati pending ammessi dalla gerarchia (`filterApprovableAccounts`).
