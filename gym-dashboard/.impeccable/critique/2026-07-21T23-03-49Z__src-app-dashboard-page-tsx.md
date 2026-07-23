# Critique — Panoramica (`src/app/(dashboard)/page.tsx`)

⚠️ DEGRADED: single-context (subagent session; dual-agent critique spawn not used)

**Target:** `/` overview home  
**Detector:** `detect.mjs --scope layout,type` → no findings  
**Browser:** not run (no live server in session)

## Assessment summary

Operational density matches PRODUCT anti-hero-metric stance: cash row + breakdown tables + Ingressi, period toggle, EntityShell states. Italian domain labels preserved.

## P0

None.

## P1 (fixed in polish)

- Three equal cash columns read close to a KPI strip → tightened to `text-lg`, hairline dividers, no card chrome.
- Empty periodo showed banner + two empty tables + duplicate shortcut nav → tables/shortcuts only when there is activity; empty keeps one actionable block.

## P2 (deferred)

- Live browser pass with mock data / empty DB (no server in this session).
- Partial-empty (solo Ingressi, zero cassa) still shows breakdown tables with empty hints — acceptable; not vanity.

## Heuristics (quick)

| # | Heuristic | Score | Note |
| --- | --- | --- | --- |
| 1 | Visibility of system status | 3 | Loading via EntityShell + opacity on refresh |
| 2 | Match real world | 4 | Entrate/Uscite/Ingressi glossary |
| 3 | User control | 3 | Period toggle + retry |
| 4 | Consistency | 3 | Shell toolbar height matches entity pages |
| 5 | Error prevention | 3 | RBAC requireRole Employee |
| 6 | Recognition | 3 | Nav Panoramica + landing |
| 7 | Flexibility | 2 | Two periods only (intentional) |
| 8 | Aesthetic minimalism | 3 | No chart collage |
| 9 | Error recovery | 3 | EntityShell retry |
| 10 | Help | 3 | Empty copy + deep links |
