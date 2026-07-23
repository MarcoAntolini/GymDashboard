# 03 — Navigation IA and domain glossary labels

**What to build:** La sidebar è organizzata per aree di dominio comprensibili, con etichette allineate al glossario di progetto. Collapse, voce attiva e header operativo non competono con il compito: l’operatore trova Clienti, Ingressi, Listino, Pagamenti senza tradurre termini tecnici inglesi fuorvianti.

**Blocked by:** 01 — Capture product context with Impeccable init

**Status:** done

## Agent workflow (Impeccable) — obbligatorio

1. Caricare Impeccable + `context.mjs`.
2. `$impeccable critique` su nav + shell laterale/header (focus: IA, recognition, carico cognitivo, consistency).
3. Fix tramite `$impeccable clarify` (etichette), `$impeccable layout` e/o `$impeccable distill` secondo il critique — non inventare una nav parallela fuori backlog.
4. `$impeccable polish` sulla shell di navigazione.
5. Controllare nav collapsed (tooltip) e expanded; entrambi i ruoli.

## Acceptance criteria

- [x] Etichette nav usano il glossario di dominio (es. Abbonamento / Pacchetto ingressi / Listino / Dipendente / Timbratura / Stipendio dove applicabile); niente mismatch grossolani tipo Memberships/Entrance Sets/Catalogs se il glossario impone altro
- [x] Le voci sono raggruppate in sezioni con senso di dominio (non lista piatta senza gerarchia)
- [x] Stato attivo della route corrente è chiaro; collapse resta usabile (label accessibili / tooltip)
- [x] Rumore non operativo in header (es. generazione mock) non compete col brand/task principale, o è relegato in modo esplicito
- [x] Critique Impeccable eseguito; P0/P1 di IA/copy nav risolti o deferred con motivo

## Glossary

Priorità assoluta a `CONTEXT.md` per i nomi UI delle entità.

## Done notes

- Labels SoT in `src/data/nav-routes.ts` (Italian glossary); `links.ts` adds icons only.
- Sections (visible labels): Personale → Operazioni → Listino → Movimenti → Uscite (Employee loses Personale and still starts on Operazioni).
- `/catalogs` label: **Listino annuale** (avoids colliding with section title “Listino”).
- Mock data: moved from header into sidebar user menu (muted secondary); header is brand + theme only.
- Active route: `aria-current="page"`; collapsed: tooltips + sr-only section/item labels.
- Href paths unchanged (RBAC map intact).
