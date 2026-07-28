# 42 — Azioni tabella: context menu + multi-select bulk

**What to build:** Azioni riga anche via context menu shadcn. Multi-select con bulk delete su ogni tabella; dove esistono azioni comuni (es. Approvazione Account) anche quelle in bulk.

**Blocked by:** 37 — CRUD: Dialog create / Sheet edit + feedback; 16 — Coda Approvazione Account

**Status:** resolved

- [x] Context menu shadcn sulle righe tabella per le azioni principali
- [x] Multi-select con selezione multipla usabile
- [x] Bulk delete su ogni tabella lista (con confirm e Restrict feedback)
- [x] Bulk Approvazione (o equivalenti) dove l’azione è comune e ammessa dal ruolo


## Comments
- 2026-07-28 claimed by implement loop

## Done
- Context menu shadcn su ogni riga DataTable: Modifica / Elimina (e Approva su Account) via registry da `ItemActions`
- Multi-select con colonna checkbox (header = pagina corrente) + barra “N selezionati”
- Bulk delete su tutte le 16 liste entity: confirm, delete sequenziale, toast Restrict per fallimento singolo, poi refetch
- Bulk Approva su Account (solo pending gestibili dal ruolo); Approva anche in dropdown/context menu riga
- Deferral: coda Approvazione (sheet ticket 16) resta single-item; nessun `deleteMany` Prisma
