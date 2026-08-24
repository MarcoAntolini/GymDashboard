# 04 — Viste: colonne native vs derivate

Policy operativa per liste/dettaglio CRUD: ogni colonna esposta ha una **classe**. Le derivate non si inventano come colonne persistite sulla tabella sbagliata; join e snapshot restano coerenti con lo schema logico e con `CONTEXT.md`.

**Classi**

| Classe | Significato | Esempio |
|---|---|---|
| `native` | Attributo della relazione dell’entità della vista | `Cliente.nome`, `Ingresso.data` |
| `join` | Dato di un’altra tabella, proiezione per leggibilità | Cliente su lista Ingressi |
| `derived` | Calcolo/aggregato/query (non colonna persistita “falsa”) | Tipo prodotto; Ingressi rimanenti su Vendita |
| `snapshot` | Fatto memorizzato all’evento (storico) | `Vendita.importo`, `durata`, `numero_ingressi` |

In codice: `src/lib/domain/column-class.ts` → `ColumnDef.meta.columnClass`.

---

## Matrice entità → colonna → classe

### Cliente (`/clients`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID, CF, Nome, Cognome, Nascita, Città, Provincia, Iscrizione | `Client.*` | native |
| Via, Civico, Telefono, Email | `Client.*` (form) | native |
| Ingressi rimanenti | — | **vietato** come attributo Cliente; è `derived` per-Vendita |

### Vendita (`/sales`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID, Data, Product Code | `Sale.*` | native |
| Cliente (etichetta; ID cliente in `#`) | `sale.client` | **join** |
| Amount / Importo | `Sale.amount` | **snapshot** |
| Durata, N ingressi | `Sale.duration`, `entranceNumber` | **snapshot** |
| Ingressi rimanenti | `packageResidual(snapshot N, COUNT ingressi)` | **derived** (sola lettura; `null` se Abbonamento) |
| Type | `productKindFromSnapshot` | **derived** (XOR snapshot; non colonna DB) |

### Ingresso (`/entrances`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID, Date, Vendita (`saleId`) | `Entrance.*` | native |
| Cliente, Prodotto | via `sale.client` / `sale.productCode` | **join** |
| Residuo pacchetto | `packageResidual` | **derived** (anteprima in form registrazione: residuo *dopo* l’Ingresso; non colonna lista) |

### Prodotto (`/products`)

| Colonna UI | Origine | Classe |
|---|---|---|
| Product Code | `Product.code` | native |
| Type | specializzazione membership XOR entranceSet | **derived** |

### Listino (`/catalogs`)

| Colonna UI | Origine | Classe |
|---|---|---|
| Year, Product Code, Price | `Catalog.*` | native |
| Type | `productKindFromProduct` | **derived** (nessun `tipo` su Listino) |

### Abbonamento / Pacchetto (`/memberships`, `/entrance-sets`)

| Colonna UI | Origine | Classe |
|---|---|---|
| Product Code, Duration / N | specializzazione corrente | native (spec Prodotto, non snapshot vendita) |

### Dipendente / Account / Contratto / Timbratura

| Vista | Colonne tipiche | Classe |
|---|---|---|
| Employees | anagrafica | native |
| Accounts | username, role, approved, employeeId | native; nome dipendente = **join** (non ancora in lista) |
| Contracts | type, hourlyFee, dates, employeeId | native; label endingDate OpenEnded = presentazione |
| Clockings | employeeId, entrance/exit | native; totale trascorso = **derived** |

### Pagamento e specializzazioni

| Vista | Colonne tipiche | Classe |
|---|---|---|
| Payments | id, date, amount, type | native (ISA) |
| Salaries / Bills / Equipment / Interventions | `paymentId` + campi propri | native |
| Date/importo pagamento, nome dipendente | via include | **join** — esposti in lista (ticket 36) |

---

## Audit (ticket 10)

| Reperto | Esito |
|---|---|
| `remainingEntrances` su Cliente | Assente da schema/app (ticket 03). Riferimenti stale in `docs/resume.txt` rimossi. |
| `tipo` su Vendita/Listino | Assente da schema; UI `Type`/`kind` = **derived**. |
| Snapshot Vendita | `amount`, `duration`, `entranceNumber` persistiti; etichette UI + `meta.columnClass`. |
| Join Ingressi | Cliente/Prodotto esposti. |
| Join Vendite | Etichetta Cliente esposta (oltre a `clientId`). |
| Join ISA (stipendi/bollette/…) | Include + colonne join in lista (ticket 36). |
| Residuo pacchetto in lista | Mostrato su Vendite come `remainingEntrances` (derived, sola lettura). Non su Cliente. |
| DTO formali con classificazione | Nessun DTO “falso”; distinzione via `meta.columnClass` + questa matrice. |

Allineamento esplicito: snapshot Vendita = ticket 02/05; filtri su join/derivati (liste server-side) = ticket 19+ — stessa policy, infrastruttura distinta.
