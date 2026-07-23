# 10 — Viste: colonne native vs derivate

**What to build:** Per ogni vista lista/dettaglio, ogni colonna è classificata: nativa, join/label, derivata/aggregata, snapshot storico. Le derivate non vengono inventate come colonne persistite sulla tabella sbagliata.

**Blocked by:** 02 — Snapshot durata e N ingressi su Acquisto

**Status:** resolved

- [x] Esiste una matrice entità → colonna → classe (nativa | join | derivata | snapshot) per le viste CRUD principali
- [x] Nessun attributo falso persistito solo per la UI (es. residuo sul Cliente)
- [x] Liste/dettaglio espongono join e derivate dove servono; in UI/DTO sono distinguibili da quelle native
- [x] Audit delle pagine/DTO attuali: violazioni corrette o documentate con motivo

## Comments

- 2026-07-23 21:53 UTC — claimed by implement loop (cloud, branch ticket-loop)

**Source:** `docs/.scratch/data-policy/issues/22-viste-colonne-native-vs-derivate.md`

## Done

- Added `VIEW_COLUMN_MATRIX` + helpers in `src/lib/domain/view-columns.ts` (`nativa` | `join` | `derivata` | `snapshot`) for all main CRUD entities; unit tests cover classification and forbidden Cliente residual keys.
- DTOs (`PurchaseWithSnapshot`, `CatalogRow`, `EntranceRow`) document column classes; TanStack `ColumnMeta.columnClass` tags on Acquisti / Ingressi / Listino columns.
- Acquisti list shows Cliente as **join** label; Amount/Duration/N as **snapshot**; Remaining as **derivata**. Ingressi split Prodotto (**join**) vs Type (**derivata · live**). Listino Type header marked derived.
- Audit: Cliente residual already absent (ticket 03); Account password write-only → ticket 15; unused payment/employee joins in stipendio/uscite lists → ticket 36. No false persisted UI attributes found.
