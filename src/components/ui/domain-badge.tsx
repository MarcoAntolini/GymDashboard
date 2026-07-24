import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { HTMLAttributes } from "react";

/** Semantic tone for category dots and status badges (DESIGN.md). */
export type DomainTone =
	| "neutral"
	| "success"
	| "warning"
	| "info"
	| "destructive"
	| "primary";

const DOT_TONE: Record<DomainTone, string> = {
	neutral: "bg-muted-foreground",
	success: "bg-success",
	warning: "bg-warning",
	info: "bg-info",
	destructive: "bg-destructive",
	primary: "bg-primary",
};

const SOFT_TONE: Record<DomainTone, string> = {
	neutral: "border-transparent bg-muted text-foreground",
	success: "border-transparent bg-success/15 text-success",
	warning: "border-transparent bg-warning/15 text-warning",
	info: "border-transparent bg-info/15 text-info",
	destructive: "border-transparent bg-destructive/15 text-destructive",
	primary: "border-transparent bg-primary/15 text-primary",
};

export type DotBadgeProps = HTMLAttributes<HTMLSpanElement> & {
	/** Always-visible category label (Tipo Pagamento, Ruolo, …). */
	label: string;
	tone?: DomainTone;
};

/**
 * Category chip: outline + colored square (Department style).
 * Use for Tipo Pagamento / Prodotto / Contratto / Ruolo — not actionable states.
 */
export function DotBadge({
	label,
	tone = "neutral",
	className,
	...props
}: DotBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground",
				className
			)}
			{...props}
		>
			<span
				aria-hidden
				className={cn("size-2 shrink-0 rounded-[2px]", DOT_TONE[tone])}
			/>
			<span className="truncate">{label}</span>
		</span>
	);
}

export type DomainBadgeProps = HTMLAttributes<HTMLSpanElement> & {
	/** Always-visible status label (Approvato, In attesa, Residuo, …). */
	label: string;
	tone?: DomainTone;
	icon?: LucideIcon;
};

/**
 * Actionable/status badge: soft fill + optional Lucide icon (Active style).
 * Use for Approvazione, residuo Ingressi, “In corso”.
 */
export function DomainBadge({
	label,
	tone = "neutral",
	icon: Icon,
	className,
	...props
}: DomainBadgeProps) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
				SOFT_TONE[tone],
				className
			)}
			{...props}
		>
			{Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
			<span className="truncate">{label}</span>
		</span>
	);
}
