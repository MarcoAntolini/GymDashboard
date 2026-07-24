# Critique — Ingressi / Acquisti / Pagamenti / Listino (ticket 38)

⚠️ Dual-agent path (Assessment A + B via Task subagents). Detector clean on all four targets.

## Verdict
Domain logic already solid; UI fidelity gaps were copy/recognition (EN create labels, bare Acquisto #id, Pagamenti specialty not inspectable, silent Listino→importo).

## P0/P1 addressed in ticket 38
- P0 Ingresso justification recognizable (helper + Acquisto giustificante column + edit panel)
- P0 Pagamenti specialty inspectable (Dettaglio column + edit Sheet)
- P1 Listino year ↔ Acquisto snapshot explained (hints + CatalogAmountDefault status)
- P1 IT domain copy on create/edit for the four surfaces
- Restrict delete messaging already present for Cliente/Acquisto/Prodotto; Listino delete note clarifies no Restrict→Acquisto

## Deferred
- Pre-submit preview of which Acquisto will be chosen (would need extra DA round-trip) — backend priority still correct; failure toast remains authoritative
- Cliente select on Acquisto create (still ID) — consistency nice-to-have, not AC-blocking
- Analytics Ingressi chrome polish beyond IT labels — out of domain-fidelity core
