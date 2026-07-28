# 46 — Tooltip/Popover solo shadcn/ui

**What to build:** Dove servono tooltip o popover, si usano i componenti shadcn/ui — niente implementazioni custom residue.

**Blocked by:** 37 — CRUD: Dialog create / Sheet edit + feedback

**Status:** resolved

- [x] Audit UI: tooltip/popover non-shadcn rimossi o sostituiti
- [x] Nuovi tooltip/popover usano solo shadcn/ui
- [x] Accessibilità base (focus/hover/keyboard) rispettata

**Source:** (todo-roadmap)

## Comments

- 2026-07-28 — claimed by implement loop

## Done

- Audit: unici overlay UI erano già shadcn (`tooltip.tsx` / `popover.tsx`); unica eccezione = `title` HTML nativo su cella troncata Pagamenti «Dettaglio».
- Sostituito quel `title` con `Tooltip` + `TooltipTrigger` + `TooltipContent` shadcn in `payments/columns.tsx`.
- Nav collassata già usava shadcn Tooltip sotto `TooltipProvider` (hover/focus su Link); Popover date/filtri già via `@/components/ui/popover`.
- Deferral esplicito: tooltip Recharts nei grafici Ingressi restano della chart library (non overlay UI shadcn).
- Commit: `2a9a82ea295be6ef2888055f49059a75f8651f89`
