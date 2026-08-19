# 05 — Mutazioni: allowlist campi editabili

Policy operativa per create/update: ogni campo ha un ruolo di mutazione. I payload in `src/data-access` passano da `assertMutationPayload` (`src/lib/domain/mutation-allowlist.ts`). Join di lettura possono arrivare dallo spread UI e vengono **strip**; snapshot/derived **immutable** se presenti → errore.

**Tag**

| Tag | Significato |
|---|---|
| `create` | Accettato in create |
| `update` | Accettato in update (incluso locator PK) |
| `immutable` | Se presente nel payload → reject |
| `Admin-only` | Solo Admin+ (`requireAdminActor`: Owner \| Admin) + gerarchia ruoli su Account |
| `write-only` | Solo scrittura (create); non in lettura sicura; su update → reject se inviato |
| `strip` | Join/proiezione di lettura: ignorato |

Codice: `MUTATION_ALLOWLIST` + `assertMutationPayload`.

---

## Matrice (sintesi per entità)

### Cliente / Dipendente

Anagrafica completa: `create` + `update`. `remainingEntrances` → **immutable** (vietato, ticket 03/10).

### Account

| Campo | Policy |
|---|---|
| `username`, `employeeId` | create (`employeeId` anche update locator) |
| `password` | create + **write-only** |
| `role`, `approved` | update + **Admin-only** (Owner gestisce Admin/Dipendente; Admin solo Dipendente; Owner non assegnabile via app) |
| `employee` | strip (join) |

### Contratto

`employeeId`, `startingDate`, `type`, `hourlyFee`, `endingDate`: create + update.  
`startingDate` su update è locator PK (non riassegnabile come cambio identità).  
`endingDate`: vedi casi limite.

### Vendita

| Campo | Policy |
|---|---|
| `clientId`, `date`, `amount`, `productCode` | create + update |
| `duration`, `entranceNumber` | **immutable** (snapshot server) |
| `type` / `kind` | **immutable** (derived) |
| `client`, `prodotto` | strip |

### Ingresso

| Campo | Policy |
|---|---|
| `clientId`, `date` | create (`date` anche update) |
| `saleId` | **immutable** (scelto da giustificazione) |
| join / `packageResidual` | strip / immutable |

### Listino / Prodotto / Abbonamento / Pacchetto

Listino: `year`, `productCode`, `price` — `type` immutable, `product` strip.  
Prodotto: solo `code`; `type`/`kind` immutable.  
Abbonamento/Pacchetto: `productCode` + `duration`/`entranceNumber`; join `product` strip.

### Timbratura / Pagamenti ISA

Timbratura: `employeeId`, `entranceTime`, `exitTime`.  
Pagamento: scalar create/update; specializzazioni solo create; include ISA → strip.  
Salary/Bill/Equipment/Intervention: campi propri; `payment`/`employee` strip.

---

## Casi limite

### 1. Cambio `productCode` su Vendita esistente

Ammesso. `duration` / `entranceNumber` **non** si editano a mano: `editSale` ricalcola lo snapshot dal Prodotto corrente (`resolveSnapshot`). Inviare `duration`/`entranceNumber` nel payload → reject.

### 2. `endingDate` Contratto indeterminato vs determinato

`resolveContractEndingDate`: OpenEnded forza `endingDate = null` anche se inviata; FixedTerm richiede fine. Overlap restano ticket 07.

### 3. Password Account

Write-only in create (register / createAccount). Non è campo di `editAccount` (solo `role`/`approved`, Admin+). Inviare `password` in update → reject. Maschera in lettura → ticket 15; cambio password self-service → ticket 17.

---

## Enforcement

- Tutte le `create*` / `edit*` in `src/data-access` chiamano `assertMutationPayload`.
- `editAccount` / `deleteAccount` chiamano `requireAdminActor()` + `assertRoleHierarchy` (Owner > Admin > Employee; promozione a Owner solo via DB).
- Smoke: `npx tsx scripts/verify-mutation-allowlist.ts`; gerarchia: `node scripts/smoke-rbac.mjs`