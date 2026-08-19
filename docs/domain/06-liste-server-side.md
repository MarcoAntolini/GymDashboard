# 06 — Liste server-side (contratto)

Fondamenta riusabili per le liste entity (ticket 19). Le migrazioni end-to-end per entità sono i ticket **20–35**.

## Contratto

| Pezzo | Ruolo |
|---|---|
| `ListQuery` | `filters` + `sort` + `page` (1-based) + `pageSize` |
| `ListResult<T>` | `items` + `total` + `pageCount` + echo di query |
| `normalizeListQuery` | Clamp page/pageSize; allowlist sort/filter |
| `toPrismaListArgs` | `skip` / `take` / `orderBy` da query già normalizzata |
| `useServerList` | Draft filters + **Filtra**; sort/page → re-query immediata |
| `DataTable` + `serverList` | `manualSorting` / `manualFiltering` / `manualPagination` |

In codice: `src/lib/list/`, `src/hooks/useServerList.ts`, prop opzionale `serverList` su `DataTable`.

## Regole UX

1. **Filtri:** i keystroke aggiornano solo lo stato *draft*. La query parte su **Filtra** (o Enter nel campo).
2. **Sort colonna:** cambio Asc/Desc → nuova query con `ORDER BY` (non sort della sola pagina client).
3. **Paginazione:** `LIMIT/OFFSET` via `skip`/`take`; `total` da `count` (o equivalente) per `pageCount`.
4. **Allowlist:** ogni entità espone `sortAllowlist` / `filterAllowlist` (campi nativi indexabili; niente injection di path arbitrari).

## Pattern data-access (esempio)

```ts
import {
  buildListResult,
  normalizeListQuery,
  toPrismaListArgs,
  type ListQuery,
  type ListQueryInput,
} from "@/lib/list";

const SORT = ["surname", "name", "taxCode", "enrollmentDate"] as const;
const FILTERS = ["taxCode", "name", "surname", "city", "province"] as const;

export async function listClients(input: ListQueryInput = {}) {
  const query = normalizeListQuery(input, {
    sortAllowlist: SORT,
    filterAllowlist: FILTERS,
    defaultSort: [{ id: "surname", desc: false }],
  });
  const where = /* build Prisma where from query.filters */;
  const { skip, take, orderBy } = toPrismaListArgs(query);
  const [total, items] = await Promise.all([
    db.client.count({ where }),
    db.client.findMany({ where, skip, take, orderBy }),
  ]);
  return buildListResult(items, total, query);
}
```

`getAll*` resta utile per select/dropdown finché non sostituito.

## UI (ticket 20+)

```tsx
const list = useServerList({
  list: listClients,
  sortAllowlist: SORT,
  filterAllowlist: FILTERS,
  defaultSort: [{ id: "surname" }],
});

<DataTable
  columns={columns}
  data={list.items}
  filters={["taxCode", "name", "surname"]}
  serverList={{
    manual: true,
    pageCount: list.pageCount,
    rowCount: list.total,
    sorting: list.sorting,
    onSortingChange: list.onSortingChange,
    pagination: list.pagination,
    onPaginationChange: list.onPaginationChange,
    draftFilters: list.draftFilters,
    onDraftFilterChange: list.setDraftFilter,
    onApplyFilters: list.applyFilters,
    onResetFilters: list.resetFilters,
    filtersDirty: list.filtersDirty,
  }}
/>
```

## Indici candidati (allineamento a `docs/db-guidelines/16-indici.md`)

Indicizzare ciò che finisce spesso in `WHERE` / `ORDER BY` delle liste (regola 80-20). Non aggiungere indici “a sensazione” senza `EXPLAIN`.

| Area | WHERE / ORDER BY tipici | Candidato |
|---|---|---|
| Clienti | CF, cognome/nome, città/provincia, data iscrizione | `taxCode` (unique già PK-like); `(surname, name)`; opz. `city`/`province` se filtrate spesso |
| Ingressi | data desc, client via vendita | `Entrance.date`; FK `saleId` |
| Vendite | data, clientId, productCode | `(clientId, date)`; `date` |
| Dipendenti / Account | cognome, username, approved | `(surname, name)`; `Account.approved` (coda) |
| Contratti / Timbrature | employeeId + date/time range | `(employeeId, startingDate)`; `(employeeId, entranceTime)` |
| Pagamenti / Bollette / … | data, type | `Payment.date`, `Payment.type` |
| Listino | year + productCode (già composta) | PK composta sufficiente |

Dettaglio fisica: `docs/db-guidelines/16-indici.md`. Le migrazioni indici restano fuori da questo ticket salvo già presenti nello schema.
