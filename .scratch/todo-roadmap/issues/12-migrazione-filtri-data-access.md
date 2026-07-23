# Migrazione filtri verso data-access

**Type:** research

**Status:** resolved

**Blocked by:** 05

## Question

Come migrare i filtri/search attuali (TanStack client-side in `data-table` + `useEntityData`) verso query Prisma parametrizzate su ogni entità? Pattern API comune, impatto su paginazione, ordine di migrazione per route.

## Answer

Ricerca completa: `.scratch/todo-roadmap/research/12-migrazione-filtri-data-access.md`

**Sintesi:** oggi `useEntityData` + `getAll*` caricano tutto in memoria; `DataTable` filtra/pagina lato TanStack. Migrare a `listX(ListQuery) → { items, total, facets? }` via server actions (no nuove API REST), paginazione **offset** (`skip`/`take` + `count`), filtri mappati colonna-per-colonna su Prisma `contains`/`in`/relation filters (MySQL). Fase 0 = infrastruttura condivisa; poi clients → … → payments (più complesso). Toolbar/faceted passano a stato controllato + facet da `groupBy` server.
