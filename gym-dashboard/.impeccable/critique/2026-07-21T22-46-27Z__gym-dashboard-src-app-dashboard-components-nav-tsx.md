---
target: dashboard nav shell
total_score: 29
p0_count: 0
p1_count: 0
timestamp: 2026-07-21T22-46-27Z
slug: gym-dashboard-src-app-dashboard-components-nav-tsx
---
⚠️ DEGRADED: single-context (subagent session; parent forbade nested sub-agents; ticket allowed degraded critique)

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Active nav clearer after aria-current; loading still spinner-only |
| 2 | Match System / Real World | 4 | Italian domain glossary now primary labels |
| 3 | User Control and Freedom | 3 | Collapse + logout confirm solid |
| 4 | Consistency and Standards | 3 | Section labels + separators; paths stay English |
| 5 | Error Prevention | 2 | Mock seed still one-click (deferred: not nav IA) |
| 6 | Recognition Rather Than Recall | 4 | Visible section labels + collapsed tooltips |
| 7 | Flexibility and Efficiency | 3 | Section order favors desk ops after Personale filter |
| 8 | Aesthetic and Minimalist Design | 3 | Mock removed from brand bar |
| 9 | Error Recovery | 2 | Nav fetch failure hard-redirects to auth |
| 10 | Help and Documentation | 2 | No in-nav help (acceptable for OLTP shell) |
| **Total** | | **29/40** | **Good** |

### Anti-Patterns Verdict

**LLM assessment**: Product sidebar pattern, not marketing slop. Risk was English SaaS nouns and unlabeled flat lists — addressed. Detector clean on scoped files.

**Deterministic scan**: `detect.mjs --json` on nav/header/layout/links → `[]`.

**Visual overlays**: Skipped (no reliable mutable browser injection in this subagent run).

### Overall Impression

Shell already had RBAC wiring; remaining work was IA order, glossary collision on Listino, and getting mock tooling out of the brand header.

### What's Working

- Single SoT `nav-routes.ts` for titles/roles/sections keeps RBAC and labels aligned.
- Collapsed tooltips include section + item.
- Domain Italian nouns match CONTEXT.md.

### Priority Issues

- **[P0] Employee saw Uscite before Operazioni** — Fixed: section order Personale → Operazioni → Listino → Movimenti → Uscite.
- **[P1] Section “Listino” and item “Listino” collided** — Fixed: catalogs item → “Listino annuale”.
- **[P1] Mock generator competed with brand in header** — Fixed: moved into sidebar user menu.
- **[P2] Active state lacked aria-current / collapsed section sr-only** — Fixed in polish.
- **[P3] Page-level English copy outside nav** — Deferred to tickets 04/06 (tables/forms), out of nav scope.

### Persona Red Flags

**Dipendente (desk)**: Was forced to scan past typed outflows before Clienti/Ingressi — mitigated by reorder. Long label “Pacchetti ingressi” needs ~220px rail.

**Amministratore**: Personale remains first when visible; Account landing unchanged.

### Minor Observations

- Sidebar width bumped to 220px for long Italian labels.
- Toast replaces alert for mock generation feedback.

### Questions to Consider

- Should typed Uscite pages eventually fold under Pagamenti (ticket 06 domain fidelity)?
- Is “Listino annuale” clearer than bare “Listino” at the desk?
