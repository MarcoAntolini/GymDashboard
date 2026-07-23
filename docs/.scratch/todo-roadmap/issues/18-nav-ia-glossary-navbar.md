# 18 — Nav IA + glossary IT + layout navbar standard

**What to build:** Sidebar e navbar organizzate in modo standard/intuitivo, etichette di dominio italiane, sezioni chiare. Include voci per profilo e capacità Owner dove previste. Collapse e active state usabili.

**Blocked by:** 12 — Capture product context with Impeccable init; 14 — Ruolo Owner + gerarchia

**Status:** resolved

- [x] Etichette nav dal glossario di dominio (CONTEXT.md)
- [x] Voci raggruppate in sezioni con senso operativo
- [x] Layout navbar più standard/intuitivo rispetto allo stato attuale
- [x] Stato attivo e collapse usabili; rumore non operativo demoted
- [x] Voci coerenti con ruoli Owner/Admin/Dipendente

**Source:** `docs/.scratch/dashboard-data-ux/issues/03-nav-ia-glossary.md` (esteso con layout navbar + Owner).

Usare skill /impeccable e /shadcn dove serve.

## Done

- Labels SoT in `src/data/nav-routes.ts` (Italian glossary); `links.ts` adds icons + section titles only.
- Sections (visible): Personale → Operazioni → Listino → Movimenti → Uscite; Employee loses Personale (Admin-only) and lands on Operazioni.
- `/catalogs` labeled **Listino annuale** to avoid colliding with section “Listino”.
- Mock data moved from header into sidebar user menu (muted secondary); header is brand + theme only.
- Active route uses `aria-current="page"`; collapsed sidebar keeps tooltips + sr-only section/item labels; empty role-filtered groups no longer leave stray separators.
- Href paths and RBAC ranks unchanged (Owner ≡ Admin nav set; Profile stays in user menu).
