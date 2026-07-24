# 18 — Nav IA + glossary IT + layout navbar standard

**What to build:** Sidebar e navbar organizzate in modo standard/intuitivo, etichette di dominio italiane, sezioni chiare. Include voci per profilo e capacità Owner dove previste. Collapse e active state usabili.

**Blocked by:** 12 — Capture product context with Impeccable init; 14 — Ruolo Owner + gerarchia

**Status:** resolved

## Comments

- 2026-07-24 — claimed by implement loop

- [x] Etichette nav dal glossario di dominio (CONTEXT.md)
- [x] Voci raggruppate in sezioni con senso operativo
- [x] Layout navbar più standard/intuitivo rispetto allo stato attuale
- [x] Stato attivo e collapse usabili; rumore non operativo demoted
- [x] Voci coerenti con ruoli Owner/Admin/Dipendente

**Source:** `docs/.scratch/dashboard-data-ux/issues/03-nav-ia-glossary.md` (esteso con layout navbar + Owner).

Usare skill /impeccable e /shadcn dove serve.

## Done

- Labels SoT in `src/data/nav-routes.ts` (glossario IT); `links.ts` aggiunge icone + sezioni.
- Sezioni: Personale → Operazioni → Listino → Movimenti → Uscite (Dipendente senza Personale; Ordine restante parte da Operazioni).
- `/catalogs` etichetta **Listino annuale** (non collide col titolo sezione Listino).
- Mock data spostato dall’header al menu utente sidebar (secondario muted); header = brand + theme.
- Active route: `aria-current="page"`; collapse: tooltip + `sr-only` su sezione/voce; dialog Esci in IT.
- Href invariati (RBAC Owner/Admin/Employee intatto via `roleAllows`).
- Deferral: voce Panoramica `/` → ticket 51.
