# 04 — Viste: colonne native vs derivate

Policy operativa per liste/dettaglio CRUD: ogni colonna esposta ha una **classe**. Le derivate non si inventano come colonne persistite sulla tabella sbagliata; join e snapshot restano coerenti con lo schema logico e con `CONTEXT.md`.

**Classi**

| Classe | Significato | Esempio |
|---|---|---|
| `native` | Attributo della relazione dell’entità della vista | `Cliente.nome`, `Ingresso.data` |
| `join` | Dato di un’altra tabella, proiezione per leggibilità | Cliente su lista Ingressi |
| `derived` | Calcolo/aggregato/query (non colonna persistita “falsa”) | Tipo prodotto; Ingressi rimanenti su Acquisto |
| `snapshot` | Fatto memorizzato all’evento (storico) | `Acquisto.importo`, `durata`, `numero_ingressi` |

In codice: `src/lib/domain/column-class.ts` → `ColumnDef.meta.columnClass`.

---

## Matrice entità → colonna → classe

### Cliente (`/clients`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID, CF, Nome, Cognome, Nascita, Città, Provincia, Iscrizione | `Client.*` | native |
| Via, Civico, Telefono, Email | `Client.*` (form) | native |
| Ingressi rimanenti | — | **vietato** come attributo Cliente; è `derived` per-Acquisto |

### Acquisto (`/purchases`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID (implicito), Client ID / Cliente, Data, Product Code | FK / scalar | native / **join** (etichetta Cliente) |
| Amount / Importo | `Purchase.amount` | **snapshot** |
| Durata, N ingressi | `Purchase.duration`, `entranceNumber` | **snapshot** |
| Type | `productKindFromSnapshot` | **derived** (XOR snapshot; non colonna DB) |

### Ingresso (`/entrances`)

| Colonna UI | Origine | Classe |
|---|---|---|
| ID, Date, Acquisto (`purchaseId`) | `Entrance.*` | native |
| Cliente, Prodotto | via `purchase.client` / `purchase.productCode` | **join** |
| Residuo pacchetto | `packageResidual` | **derived** (non in lista; usato in giustificazione) |

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
| Clockings | employeeId, entrance/exit | native |

### Pagamento e specializzazioni

| Vista | Colonne tipiche | Classe |
|---|---|---|
| Payments | id, date, amount, type | native (ISA) |
| Salaries / Bills / Equipment / Interventions | `paymentId` + campi propri | native |
| Date/importo pagamento, nome dipendente | via include | **join** — caricati in data-access; colonne UI deferred (liste ISA minimali) |

---

## Audit (ticket 10)

| Reperto | Esito |
|---|---|
| `remainingEntrances` su Cliente | Assente da schema/app (ticket 03). Riferimenti stale in `docs/resume.txt` rimossi. |
| `tipo` su Acquisto/Listino | Assente da schema; UI `Type`/`kind` = **derived**. |
| Snapshot Acquisto | `amount`, `duration`, `entranceNumber` persistiti; etichette UI + `meta.columnClass`. |
| Join Ingressi | Cliente/Prodotto esposti. |
| Join Acquisti | Etichetta Cliente esposta (oltre a `clientId`). |
| Join ISA (stipendi/bollette/…) | Include presenti; colonne commentate — **deferral** documentato (non violazione di persistenza). |
| Residuo pacchetto in lista | Non mostrato; resta aggregato in domain (`purchase-access`) — ok. |
| DTO formali con classificazione | Nessun DTO “falso”; distinzione via `meta.columnClass` + questa matrice. |

Allineamento esplicito: snapshot Acquisto = ticket 02/05; filtri su join/derivati (liste server-side) = ticket 19+ — stessa policy, infrastruttura distinta.
