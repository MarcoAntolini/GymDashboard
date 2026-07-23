---
name: Gym Dashboard
description: shadcn/ui + Tailwind tokens for the gym OLTP dashboard (orange primary, Inter, light/dark)
colors:
  background: "#ffffff"
  foreground: "#0c0a09"
  primary: "#f97316"
  primary-foreground: "#fafaf9"
  secondary: "#f5f5f4"
  secondary-foreground: "#1c1917"
  muted: "#f5f5f4"
  muted-foreground: "#78716c"
  accent: "#f5f5f4"
  accent-foreground: "#1c1917"
  destructive: "#ef4444"
  destructive-foreground: "#fafaf9"
  success: "#1a9a4a"
  warning: "#c26a05"
  info: "#0a8bbd"
  border: "#e7e5e4"
  input: "#e7e5e4"
  ring: "#f97316"
  dark-background: "#0c0a09"
  dark-foreground: "#fafaf9"
  dark-primary: "#ea580c"
  dark-secondary: "#292524"
  dark-muted: "#292524"
  dark-muted-foreground: "#a8a29e"
  dark-border: "#292524"
  dark-success: "#2db85c"
  dark-warning: "#f59e0b"
  dark-info: "#38bdf8"
typography:
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  nav-section:
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.025em"
rounded:
  sm: "calc(0.5rem - 4px)"
  md: "calc(0.5rem - 2px)"
  lg: "0.5rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  button-destructive:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive-foreground}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  card-shell:
    backgroundColor: "{colors.background}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
---

## Overview

Visual system extracted from the existing Next.js + shadcn/ui + Tailwind setup (`src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`). Identity is a warm **orange primary** on neutral stone-tinted surfaces, Inter as the sole sans, and a collapsible sidebar + data-table shell. Light and dark themes share the same roles via CSS variables. This file documents what ships today — it does not propose a rebrand.

Canonical sources: HSL CSS variables in `globals.css`; hex below is sRGB approximation for tooling. Prefer editing the CSS variables when changing tokens.

## Colors

Roles map 1:1 to shadcn semantic tokens:

| Role | Light (approx hex) | Notes |
| --- | --- | --- |
| background / card / popover | `#ffffff` | App canvas and elevated panels |
| foreground | `#0c0a09` | Near-black, slight warm hue |
| primary / ring | `#f97316` | Orange CTA and focus ring |
| secondary / muted / accent | `#f5f5f4` | Subtle fills, hover rows |
| muted-foreground | `#78716c` | Secondary labels, nav section titles |
| destructive | `#ef4444` | Delete / logout danger; uscite / saldo negativo |
| success | `#1a9a4a` | Entrate, approvato, residuo Pacchetto ok |
| warning | `#c26a05` | In attesa, residuo basso, bolletta |
| info | `#0a8bbd` | Pacchetto, attrezzatura, Ingressi accent |
| border / input | `#e7e5e4` | Dividers and field chrome |

Dark mode shifts background/foreground to `#0c0a09` / `#fafaf9`, primary to `#ea580c`, and surfaces/borders to `#292524`. Semantic success/warning/info keep the same roles with slightly higher lightness. Do not invent brand hues beyond primary; extend via these semantic roles.

Domain category chips live in `domain-badge.tsx`:

- **`DotBadge`** — outline neutra + quadratino colorato (categorie: Tipo Pagamento, Tipo Prodotto, Ruolo, Tipo Contratto). Stile “Department” della tabella di riferimento.
- **`DomainBadge`** — fill soft + icona (stati: Approvazione, residuo Ingressi, “In corso”). Stile “Active / Inactive”.

Date in lista: `formatDateIt` / `formatDateTimeIt` usano mese abbreviato italiano (`24 ott 2018`), non `gg/mm/aaaa`.

Column headers: `TableSortableHeader` accetta `icon` (Lucide muted a sinistra del titolo).

## Typography

Single family: **Inter** loaded as `--font-sans` (Next `next/font/google`). No display/serif pairing. Hierarchy is weight + size only: body ~16px, form labels ~14px medium, nav section headings ~12px medium with slight tracking. Tables and forms dominate; avoid marketing-scale clamp headlines.

## Elevation

No dedicated shadow scale in tokens. Separation is mostly **borders** (`border`) and the dashboard **Card** shell around sidebar + content. Prefer border + background shift over soft multi-layer drop shadows. Radius base `--radius: 0.5rem` (8px); Tailwind `rounded-lg/md/sm` derive from it.

## Components

- **App shell:** header + collapsible sidebar (`Nav` from `links.ts`) + main content inside a bordered Card.
- **Primary actions:** shadcn `Button` default/primary (orange).
- **Danger:** destructive variant (logout, delete confirms via AlertDialog).
- **Data surfaces:** TanStack data tables with toolbar filters, faceted filters, pagination — density over card grids. Category/status cells use `DomainBadge` (soft tint + Lucide icon).
- **Feedback:** Sonner toasts (`richColors`); loading via spinners on nav fetch.
- **Theming:** `next-themes` class strategy (`light` / `dark` / system).
- **Money direction:** `MoneyTone` — green for Entrate/Acquisti, red for Uscite/Pagamenti, signed for Saldo.

Reuse `@/components/ui/*` before adding one-offs.

## Do's and Don'ts

**Do**

- Keep orange primary for primary actions and focus; keep neutrals for chrome.
- Use domain Italian labels already in nav (Ingressi, Acquisti, Pagamenti, …).
- Prefer table + form patterns for CRUD.
- Preserve light/dark token pairs when adding surfaces.

**Don't**

- Introduce purple/indigo gradients, cream editorial backgrounds, or glassmorphism as defaults.
- Add hero metrics, marketing sections, or decorative card grids on operational routes.
- Swap Inter for a second competing sans without a typeset pass.
- Invent new brand colors outside the shadcn semantic set without updating `globals.css` first.
