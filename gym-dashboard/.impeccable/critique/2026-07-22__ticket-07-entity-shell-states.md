# Critique — ticket 07 entity shell (loading / error / empty)

**Target:** `src/hooks/useEntityData.ts`, `src/components/ui/entity-shell.tsx`, `dashboard-placeholder.tsx`, `data-table.tsx`
**Mode:** degraded (code + a11y review; no live forced-fetch browser pass)

## P0
- ~~Infinite spinner when `getAll` throws~~ — fixed: `try/catch/finally` clears `isLoading`, exposes `error` + `retry`.

## P1
- ~~Pages only checked `isLoading`~~ — fixed via `EntityShell` on 16 entity pages.
- Error region uses `role="alert"` + Riprova; loading uses `role="status"` + `aria-busy`.
- Empty dataset vs filter-empty remain distinct; domain `entityLabel` + optional `emptyGuidance`.

## P2 / deferred
- Skeleton table rows instead of centered spinner (product.md preference) — deferred; shell already uses coherent Loader2 + toolbar-height spacer matching Dashboard.
- Secondary `useEntityData` hooks (employees-without-account/contract) still silent on failure — deferred; does not block main list shell.
- Entrances analytics sheet English copy — out of scope (ticket 06 domain fidelity).

## Harden / onboard / polish
- Harden: fetch failure recoverable; reduced-motion disables spinner spin.
- Onboard: empty states teach next action in domain terms (create action or parent-flow hint).
- Polish: shared placeholder aligns with Dashboard chrome (52px toolbar + Separator).
