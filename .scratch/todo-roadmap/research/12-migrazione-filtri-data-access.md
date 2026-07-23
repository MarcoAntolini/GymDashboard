# Research: migrazione filtri/search verso data-access Prisma

**Ticket:** `.scratch/todo-roadmap/issues/12-migrazione-filtri-data-access.md`  
**Blocked by:** issue 05 (perimetro filtri DB — risolto)  
**Date:** 2026-07-22

## Question

Come migrare i filtri/search attuali (TanStack client-side in `data-table` + `useEntityData`) verso query Prisma parametrizzate per entità? Pattern API comune, impatto paginazione, ordine di migrazione per route.

## Context (decisioni già fisse)

Da `.scratch/todo-roadmap/issues/05-filtri-search-lato-db.md`:

- Tutti i filtri **e** la search → DB-side (parametri su data-access/Prisma).
- Search = `contains`/`LIKE` parametrizzato su colonne nominate.
- Resta client-side: stato paginazione UI, sort colonne solo se locale, search highlight (render), loading/error/empty.

---

## 1. Stato attuale nel codebase

### 1.1 Fetch: tutto in memoria, nessun parametro lista

`useEntityData` carica l’intero dataset una volta al mount via `actions.getAll()`, senza filtri né paginazione server.

```18:41:gym-dashboard/src/hooks/useEntityData.ts
export function useEntityData<T, K extends EntityKey<T>>(
	actions: EntityActions<T, K>,
	identifierKeys: K[]
) {
	const [data, setData] = useState<T[]>([]);
	// ...
	const fetchData = useCallback(async () => {
		// ...
			const fetchedData = await actions.getAll();
			setData(fetchedData);
	// ...
	useEffect(() => {
		fetchData();
	}, [fetchData]);
```

Ogni `getAll*` in `gym-dashboard/src/data-access/*.ts` è un `findMany()` senza `where` utente, `skip`, `take` o `cursor`. Esempio tipico:

```38:40:gym-dashboard/src/data-access/clients.ts
export async function getAllClients() {
	await requireRole("Employee");
	return await db.client.findMany();
}
```

Include/join già presenti dove servono DTO derivati (es. `getAllEntrances` con `purchase.client`, `getAllContracts` con `employee`).

**Transport:** server actions (`"use server"` nei file data-access), invocate dal client. Non esistono route REST per liste entità (`gym-dashboard/src/app/api/` ha solo auth + mock-data). `useSearchParams` compare solo in `forbidden/page.tsx`.

### 1.2 Filtri: TanStack 100% client-side

`DataTable` abilita filtro, sort e paginazione client:

```47:64:gym-dashboard/src/components/ui/data-table.tsx
	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		onSortingChange: setSorting,
		getSortedRowModel: getSortedRowModel(),
		onColumnFiltersChange: setColumnFilters,
		getFilteredRowModel: getFilteredRowModel(),
		getFacetedRowModel: getFacetedRowModel(),
		getFacetedUniqueValues: getFacetedUniqueValues(),
		// ...
	});
```

**Text filter** (`TableToolbar`): input per colonna → `column.setFilterValue` → default TanStack `includes` sulla stringa del valore colonna.

```42:51:gym-dashboard/src/components/ui/data-table/table-toolbar.tsx
				{filters.map((filter) => (
					<Input
						key={filter}
						placeholder={labelFor(filter)}
						value={(table.getColumn(filter)?.getFilterValue() as string) ?? ""}
						onChange={(event) => table.getColumn(filter)?.setFilterValue(event.target.value)}
```

**Faceted filter**: opzioni derivate da **tutte** le righe caricate (`getCoreRowModel().flatRows`), non dal DB filtrato:

```52:63:gym-dashboard/src/components/ui/data-table/table-toolbar.tsx
				{facetedFilters?.map((filter) => (
					<TableFacetedFilter
						key={filter}
						column={table.getColumn(filter)}
						title={labelFor(filter)}
						options={Array.from(
							new Set(table.getCoreRowModel().flatRows.map((row) => row.getValue(filter)))
						).map((value) => ({
```

Colonne faceted con `filterFn` custom (match esatto su array di stringhe) in:  
`clients/columns.tsx`, `employees/columns.tsx`, `accounts/columns.tsx`, `products/columns.tsx`, `catalogs/columns.tsx`, `contracts/columns.tsx`, `entrances/columns.tsx`, `payments/columns.tsx`, `purchases/columns.tsx`.

**Paginazione UI** (`table-pagination.tsx`): page index/size TanStack su righe **già filtrate in memoria** — con filtri DB obbligatori, questo diventa fuorviante se non si passa a `manualPagination`.

### 1.3 Colonne derivate e filtri UI

Issue 02: colonne native + derivati read-only via join/query. Molti filtri UI puntano a **id colonna derivati** (`accessorFn`), non a campi Prisma diretti:

| Colonna UI | Entità | Implementazione attuale |
|------------|--------|-------------------------|
| `client` | purchases, entrances | `personLabel(purchase.client)` — `gym-dashboard/src/lib/format.ts` |
| `employee` | contracts | `personLabel(contract.employee)` |
| `product` | entrances | label codice + tipo |
| `kind` / `typeLabel` | products, catalogs, purchases, payments, contracts | label da enum/relazione |
| `roleLabel`, `approvedLabel` | accounts | label da boolean/enum |
| `detail` | payments | stringa concatenata multi-campo — `payments/columns.tsx` |

Per la migrazione serve una **mappa colonna UI → predicato Prisma** per ogni entità (non riusare `accessorFn` come where).

### 1.4 Precedenti server-side (non tabelle CRUD)

Pattern già DB-parametrizzati utili come riferimento:

- **Periodo date:** `getOverviewStats` in `gym-dashboard/src/data-access/overview.ts` (`where: { date: { gte, lte } }`).
- **Analytics ingressi:** `getDailyEntrances` / `getWeeklyEntrances` / `getMonthlyEntrances` in `entrances.ts` (range + aggregazioni).
- **Guadagni contratti:** `getEmployeesEarningsInPeriod` in `contracts.ts`.

Nessun uso esistente di `contains`, `mode: 'insensitive'`, `skip`/`take` nel repo.

### 1.5 DB

`prisma/schema.prisma`: provider **MySQL**. `contains` Prisma → `LIKE '%value%'` (parametrizzato). Case sensitivity dipende dalla collation MySQL del DB — non assumere `insensitive` finché non verificata.

---

## 2. Inventario filtri per route (16 pagine lista + 1 tabella secondaria)

| Route | `filters` | `facetedFilters` | File page |
|-------|-----------|------------------|-----------|
| `/clients` | surname, name, taxCode | city, province | `clients/page.tsx` |
| `/employees` | taxCode, name, surname | city, province | `employees/page.tsx` |
| `/accounts` | username | roleLabel, approvedLabel | `accounts/page.tsx` |
| `/products` | code | kind | `products/page.tsx` |
| `/memberships` | productCode | duration | `memberships/page.tsx` |
| `/entrance-sets` | productCode | entranceNumber | `entrance-sets/page.tsx` |
| `/catalogs` | productCode | year, kind | `catalogs/page.tsx` |
| `/purchases` | client, productCode | kind | `purchases/page.tsx` |
| `/entrances` | client, product | product | `entrances/page.tsx` |
| `/payments` | detail | typeLabel | `payments/page.tsx` |
| `/contracts` | employee | typeLabel | `contracts/page.tsx` |
| `/clockings` | employeeId | — | `clockings/page.tsx` |
| `/salaries` | employeeId, paymentId | — | `salaries/page.tsx` |
| `/bills` | paymentId, provider | — | `bills/page.tsx` |
| `/equipment` | paymentId, provider | — | `equipment/page.tsx` |
| `/interventions` | paymentId, maker | — | `interventions/page.tsx` |
| Contratti → sheet guadagni | employeeId | — | `contracts/page.tsx` (seconda `DataTable`) |

Tutte usano lo stesso stack: `EntityShell` + `useEntityData` + `DataTable`.

---

## 3. Raccomandazioni

### 3.1 Pattern DTO condiviso (lista paginata)

Introduzione di tipi condivisi (es. `gym-dashboard/src/lib/list-query.ts`):

```typescript
/** Filtro testo colonna — maps to Prisma contains */
export type TextFilter = { kind: "text"; value: string };

/** Filtro faceted — maps to Prisma in / equals */
export type EnumFilter = { kind: "enum"; values: string[] };

/** Filtro numerico esatto (faceted su Int) */
export type NumberFilter = { kind: "number"; values: number[] };

export type ColumnFilters = Record<string, TextFilter | EnumFilter | NumberFilter>;

export type ListQuery = {
  page: number;       // 0-based, allineato a TanStack pageIndex
  pageSize: number;
  sort?: { id: string; desc: boolean };
  filters: ColumnFilters;
};

export type ListResult<T> = {
  items: T[];
  total: number;
  facets?: Record<string, { value: string; count: number }[]>;
};
```

**Per entità:** file config o sezione in data-access, es. `clientListConfig`:

```typescript
export const clientFilterMap = {
  surname: (v: string) => ({ surname: { contains: v } }),
  name: (v: string) => ({ name: { contains: v } }),
  taxCode: (v: string) => ({ taxCode: { contains: v } }),
  city: (values: string[]) => ({ city: { in: values } }),
  province: (values: string[]) => ({ province: { in: values } }),
} satisfies Record<string, ...>;
```

**API data-access:** sostituire (o affiancare) `getAllX()` con:

```typescript
export async function listClients(query: ListQuery): Promise<ListResult<Client>>
```

Implementazione comune:

```typescript
const where = buildWhere(query.filters, clientFilterMap);
const [total, items] = await Promise.all([
  db.client.count({ where }),
  db.client.findMany({
    where,
    skip: query.page * query.pageSize,
    take: query.pageSize,
    orderBy: resolveOrderBy(query.sort, clientSortMap),
  }),
]);
```

Helper `buildWhere`: per filtri testo multipli sulla stessa entità → `AND` di `contains`; per search globale futura → `OR` su colonne whitelist.

**Validazione:** schema Zod condiviso su `ListQuery` (max pageSize, sanitize string length) prima di toccare Prisma.

### 3.2 URL searchParams vs server actions

| Opzione | Pro | Contro |
|---------|-----|--------|
| **Server actions** (status quo) | RBAC già in `requireRole`; nessuna nuova superficie HTTP; pattern usato da 16 pagine | Stato filtri non bookmarkabile senza sync URL |
| **Route Handler GET + searchParams** | REST/cache-friendly | Nuovo layer duplicato; auth da replicare |
| **RSC + searchParams** | URL nativo Next | Pagine oggi `"use client"` con mutazioni inline; refactor ampio |

**Raccomandazione:** mantenere **server actions** come transport primario (`listClients(query)`). Opzionalmente sincronizzare `ListQuery` ↔ `URLSearchParams` nel client (debounced) per deep-link — stesso payload, zero nuove API.

Motivo: tutti i data-access sono già `"use server"` con auth (`gym-dashboard/src/lib/auth.ts`); le route API esistenti coprono solo auth.

### 3.3 Strategia paginazione: offset (skip/take)

**Usare offset**, non cursor, per questo progetto:

1. UI già orientata a pagina N/M e salto prima/ultima (`table-pagination.tsx`).
2. Dataset palestra: volumi moderati; `COUNT(*)` + `LIMIT/OFFSET` accettabile con indici su colonne filtrate.
3. Chiavi composite (`Contract`, `Clocking`) rendono cursor fragile.
4. Filtri faceted + total count richiedono comunque query aggregate.

TanStack: `manualPagination: true`, `pageCount: Math.ceil(total / pageSize)`, dati = solo `items` corrente.

**Nota su sort:** con paginazione DB, sort **deve** essere server-side (`orderBy`). Sort solo client sul page corrente è scorretto — non allineato al vincolo “filtri DB” anche se issue 05 menziona “sort locale”. Implementare `orderBy` mappato da `TableSortableHeader` (`table-sortable-header.tsx`).

Default sensati già in codebase: ingressi `orderBy: { date: 'desc' }` (`entrances.ts`).

### 3.4 Prisma `contains` vs raw SQL

**Default: Prisma typed `contains` / `in` / relation filters.** Adeguato per MySQL e per evitare SQL injection (parametri già bindati).

Esempi per colonne derivate:

```typescript
// client su purchases / entrances
{
  OR: [
    { client: { surname: { contains: q } } },
    { client: { name: { contains: q } } },
  ]
}
// oppure via purchase:
{ purchase: { client: { surname: { contains: q } } } }

// kind su products
{
  OR: [
    { membership: { isNot: null } },  // quando faceted = "Abbonamento"
    { entranceSet: { isNot: null } },
  ]
}

// typeLabel su payments → filtrare su enum nativo
{ type: { in: [PaymentType.Bill, ...] } }

// roleLabel / approvedLabel → campi nativi
{ role: Role.Admin }, { approved: true }
```

**Raw SQL** solo se necessario:

- `payments.detail`: oggi è stringa UI concatenata (`paymentDetail()` in `payments/columns.tsx`). Preferire **decomposizione** in filtri su relazioni (`bill.provider`, `intervention.maker`, …) o `OR` multi-branch; raw solo se si insiste su un unico campo “detail”.
- Facet counts su join complessi: `groupBy` Prisma dove possibile; altrimenti query raw mirata.

**Indici:** aggiungere su colonne `WHERE` frequenti (issue 05 / guidelines DB): `client.surname`, `client.city`, `purchase.productCode`, `entrance.date`, `payment.type`, ecc.

### 3.5 Impatto su `table-toolbar` e faceted filters

| Componente | Oggi | Dopo migrazione |
|------------|------|-----------------|
| Text inputs | `setFilterValue` TanStack | Stato `ListQuery.filters` + debounce 300ms → `listX(query)` |
| Faceted options | Unique values da righe caricate | `facets` da server (`groupBy` / `distinct`) scoped ai filtri correnti (escludendo la colonna facet) |
| Facet counts | `getFacetedUniqueValues()` | Opzionale in `ListResult.facets` |
| Reset | `resetColumnFilters()` | Reset `filters` + `page: 0` + refetch |
| Colonne visibility | Resta client | Nessun cambio |
| `DataTable` | `getFilteredRowModel`, `getFaceted*` | Rimuovere; `manualPagination` + `manualFiltering` |
| `filterFn` in columns | Client | Rimuovere quando server mappa colonna |
| Empty states | `data.length === 0` vs filtered | `total === 0` con/senza filtri attivi |

**Hook:** estendere o sostituire `useEntityData` con `useEntityList` che:

- tiene `ListQuery` in state (e opz. URL);
- refetch on filter/page/sort change;
- espone `total`, `isLoading`, `retry`, mutazioni CRUD (invalidate/refetch pagina corrente).

**Mutazioni post-create/edit/delete:** oggi aggiornano array locale; con paginazione server → `refetch()` o insert ottimistico solo se record rientra nei filtri correnti.

---

## 4. Ordine di migrazione consigliato

Allineato a issue 07 (onda 2 = architecture/data access prima del polish UI).

### Fase 0 — Infrastruttura (blocca tutte le route)

1. `lib/list-query.ts` — tipi, Zod, `buildWhere`, `resolveOrderBy`
2. `useEntityList` (o refactor `useEntityData`)
3. `DataTable` — modalità server (props: `total`, `query`, `onQueryChange`, `facetOptions`)
4. `TableToolbar` / `TableFacetedFilter` — controlled, niente `getCoreRowModel`
5. Pilota end-to-end su **una** entità semplice

### Fase 1 — Entità piatte (campi scalari, alto riuso)

1. **clients** — 3 text + 2 faceted nativi; riferimento per employees  
2. **employees** — clone pattern clients  
3. **memberships** — productCode + duration (faceted numerico)  
4. **entrance-sets** — idem  
5. **products** — kind derivato ma mappabile su relazione  
6. **catalogs** — year enum-like + kind  

### Fase 2 — Entità semplici collegate

7. **clockings** — employeeId  
8. **accounts** — username + faceted role/approved (Admin-only)  
9. **bills**, **equipment**, **interventions** — paymentId + campo testo (provider/maker)  
10. **salaries** — employeeId + paymentId  

### Fase 3 — Join e derivati complessi

11. **contracts** — employee join + type enum  
12. **purchases** — client join + kind + productCode  
13. **entrances** — client/product join; volume potenzialmente alto → priorità indice su `date`  
14. **payments** — type faceted + detail search (caso più difficile)  

### Fase 4 — Eccezioni

15. **Sheet guadagni contratti** — dataset già periodo-limitato da `getEmployeesEarningsInPeriod`; può restare client-side **solo se** il periodo è sempre ristretto; altrimenti applicare stesso `ListQuery` per coerenza.

**Parallelismo:** Fase 1 entità indipendenti in parallelo dopo Fase 0; Fase 3 sequenziale per riuso mappe join (client → purchases → entrances).

---

## 5. Rischi e edge case

1. **Filtro su colonna derivata vs DB:** mismatch se UI cerca `"Rossi Mario (#12)"` e DB filtra solo `surname` — documentare che search colonna `client` = OR su name/surname (e opz. `id` se query numerica).
2. **paymentId text filter:** oggi `includes` su stringa; DB = `equals` se intero valido, altrimenti nessun match (o cast esplicito).
3. **Faceted numeric** (`duration`, `entranceNumber`, `year`): UI usa stringhe; server `in: numbers.map(Number)`.
4. **Performance N+1 facet:** batch facet query per pagina o cache breve; non una query per ogni faceted dropdown.
5. **RBAC:** `listX` deve chiamare lo stesso `requireRole` di `getAllX` (es. accounts/salaries/contracts Admin).
6. **Regressione empty state:** distinguere “zero record in DB” vs “zero match filtri” usando `total` e presenza filtri in `ListQuery`.

---

## 6. Checklist implementazione per entità

- [ ] `listX(query: ListQuery): Promise<ListResult<XDTO>>` in data-access  
- [ ] `xFilterMap` / `xSortMap`  
- [ ] `getXFacets?(field, query)` se faceted  
- [ ] Page: `useEntityList` + pass query to `DataTable`  
- [ ] Rimuovere `filterFn` obsolete da `columns.tsx`  
- [ ] Indice DB su colonne filtrate  
- [ ] Smoke: filtro text + faceted + pagina 2 + sort + CRUD refetch  

---

## Sources (primary)

| Claim | Source |
|-------|--------|
| Fetch all-on-mount, no list params | `gym-dashboard/src/hooks/useEntityData.ts` |
| Client filter/sort/paginate TanStack | `gym-dashboard/src/components/ui/data-table.tsx` |
| Toolbar text + faceted from loaded rows | `gym-dashboard/src/components/ui/data-table/table-toolbar.tsx` |
| Pagination UI page index | `gym-dashboard/src/components/ui/data-table/table-pagination.tsx` |
| Server actions data-access | `gym-dashboard/src/data-access/*.ts` (`"use server"`) |
| Filtri per route | `gym-dashboard/src/app/(dashboard)/*/page.tsx` (grep `filters=`) |
| Colonne derivate / filterFn | `gym-dashboard/src/app/(dashboard)/*/columns.tsx` |
| personLabel join UI | `gym-dashboard/src/lib/format.ts` |
| Precedente filtro date DB | `gym-dashboard/src/data-access/overview.ts`, `entrances.ts` |
| Perimetro filtri DB | `.scratch/todo-roadmap/issues/05-filtri-search-lato-db.md` |
| Ordine ondate roadmap | `.scratch/todo-roadmap/issues/07-ordine-ondate-roadmap.md` |
| Regola colonne derivate | `.scratch/todo-roadmap/issues/02-colonne-derivate-tabelle.md` |
| MySQL provider | `gym-dashboard/prisma/schema.prisma` |
