import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/** Semantica colore fissa (DESIGN.md): entrate/success, uscite/danger, warning, info. */
export type SemanticTone = "success" | "warning" | "info" | "destructive" | "muted" | "primary";

const DOT_TONE: Record<SemanticTone, string> = {
	success: "bg-success",
	warning: "bg-warning",
	info: "bg-info",
	destructive: "bg-destructive",
	muted: "bg-muted-foreground",
	primary: "bg-primary",
};

const SOFT_TONE: Record<SemanticTone, string> = {
	success: "border-success/25 bg-success/10 text-success",
	warning: "border-warning/25 bg-warning/10 text-warning",
	info: "border-info/25 bg-info/10 text-info",
	destructive: "border-destructive/25 bg-destructive/10 text-destructive",
	muted: "border-border bg-muted text-muted-foreground",
	primary: "border-primary/25 bg-primary/10 text-primary",
};

const MONEY_TONE: Record<"income" | "expense" | "neutral", string> = {
	income: "text-success",
	expense: "text-destructive",
	neutral: "text-foreground",
};

/**
 * Chip categoria: outline neutra + quadratino colorato + etichetta sempre presente.
 * Uso: Tipo Pagamento, Tipo Prodotto, Ruolo, Tipo Contratto.
 */
export function DotBadge({
	label,
	tone = "muted",
	className,
}: {
	label: string;
	tone?: SemanticTone;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-0.5 text-xs font-medium text-foreground",
				className
			)}
		>
			<span
				aria-hidden
				className={cn("size-2 shrink-0 rounded-[2px]", DOT_TONE[tone])}
			/>
			<span className="truncate">{label}</span>
		</span>
	);
}

/**
 * Badge stato azionabile: fill soft + icona + etichetta sempre presente.
 * Uso: Approvazione, “In corso”, residuo Ingressi.
 */
export function DomainBadge({
	label,
	tone = "muted",
	icon: Icon,
	className,
}: {
	label: string;
	tone?: SemanticTone;
	icon?: LucideIcon;
	className?: string;
}) {
	return (
		<span
			className={cn(
				"inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium",
				SOFT_TONE[tone],
				className
			)}
		>
			{Icon ? <Icon aria-hidden className="size-3.5 shrink-0" /> : null}
			<span className="truncate">{label}</span>
		</span>
	);
}

/** Colore importi: entrate (Acquisti) vs uscite (Pagamenti) vs saldo firmato. */
export function MoneyTone({
	tone,
	amount,
	children,
	className,
}: {
	tone?: "income" | "expense" | "neutral" | "signed";
	amount?: number;
	children: ReactNode;
	className?: string;
}) {
	const resolved =
		tone === "signed"
			? amount == null || amount === 0
				? "neutral"
				: amount > 0
					? "income"
					: "expense"
			: (tone ?? "neutral");

	return (
		<span className={cn("tabular-nums", MONEY_TONE[resolved], className)}>
			{children}
		</span>
	);
}

/** Cella numerica (prezzi/quantità, non id): allineata a destra. */
export function NumericCell({
	children,
	className,
	muted,
}: {
	children: ReactNode;
	className?: string;
	muted?: boolean;
}) {
	return (
		<div
			className={cn(
				"text-right tabular-nums font-medium",
				muted && "text-muted-foreground font-normal",
				className
			)}
		>
			{children}
		</div>
	);
}
