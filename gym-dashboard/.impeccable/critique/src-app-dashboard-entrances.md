# Critique — Ingressi / Acquisti / Pagamenti / Listino (ticket 06)

⚠️ DEGRADED: single-context (running as subagent; Task/spawn_agent unavailable for isolated Assessment A/B)

**Date:** 2026-07-22  
**Targets:** `entrances`, `purchases`, `payments`, `catalogs`  
**Detector:** clean (`detect.mjs --json` → `[]`)

## Strengths

- Giustificazione Ingresso → Acquisto è visibile in anteprima, in lista e nei toast.
- Residuo pacchetto è per Acquisto (derivato), non sul Cliente.
- Listino anno + importo snapshot spiegati in form e colonne.

## P0 / P1 (fedeltà dominio) — risolti in questo ticket

| Issue | Resolution |
| --- | --- |
| Registrazione Ingresso non esponeva la regola di giustificazione | Anteprima live + toast post-create; edit ricalcola Acquisto |
| Fallimento giustificazione opaco | Messaggio dominio già in data-access; UI lo mostra via toast Dashboard |
| Residuo non visibile / rischio contatore su Cliente | Colonna «Ingressi rimanenti» solo su Acquisto Pacchetto |
| Snapshot Listino non comprensibile | Hint form + colonna «Importo (snapshot) · Listino YYYY» |
| Dettaglio Pagamento generico | Label tipizzate (Fornitore/Attuatore/…) + edit con campi specializzazione |
| Restrict delete poco actionable | Copy Cliente/Acquisto/Prodotto/Listino aggiornata |

## Deferred

- Sheet analytics Ingressi ancora in inglese (Daily/Weekly/Monthly) — fuori scope fedeltà giustificazione; ticket copy/IA se ripreso.
- Empty/loading shell — ticket 07 (evitato tocco a `useEntityData` / `DataTable`).
