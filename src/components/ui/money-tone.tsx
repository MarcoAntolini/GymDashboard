import { formatCurrencyEur } from "@/lib/format/locale";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export type MoneyDirection = "income" | "expense" | "neutral" | "signed";

export type MoneyToneProps = HTMLAttributes<HTMLSpanElement> & {
	amount: number | string;
	/** Entrate/Acquisti → success; Uscite/Pagamenti → destructive; Saldo → signed. */
	direction?: MoneyDirection;
};

/**
 * Currency cell with fixed money-direction color (DESIGN.md).
 * Always right-aligned tabular nums for list density.
 */
export function MoneyTone({
	amount,
	direction = "neutral",
	className,
	...props
}: MoneyToneProps) {
	const numeric =
		typeof amount === "number" ? amount : Number.parseFloat(String(amount));
	const resolved: Exclude<MoneyDirection, "signed"> =
		direction === "signed"
			? !Number.isFinite(numeric)
				? "neutral"
				: numeric < 0
					? "expense"
					: numeric > 0
						? "income"
						: "neutral"
			: direction;

	const toneClass =
		resolved === "income"
			? "text-success"
			: resolved === "expense"
				? "text-destructive"
				: "text-foreground";

	return (
		<span
			className={cn(
				"block text-right font-medium tabular-nums",
				toneClass,
				className
			)}
			{...props}
		>
			{formatCurrencyEur(amount)}
		</span>
	);
}
