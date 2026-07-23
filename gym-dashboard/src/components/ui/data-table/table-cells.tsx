"use client";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/** Right-aligned domain numerics (prices, amounts, quantities — not ids). */
export const numericCellClassName = "text-right tabular-nums font-medium";

/** Pair with numeric cells so the header lines up with values. */
export const numericHeaderClassName = "justify-end text-right";

type NumericCellProps = {
	children: ReactNode;
	className?: string;
	/** Optional shadcn tooltip (replaces native `title`). */
	tooltip?: ReactNode;
};

export function NumericCell({ children, className, tooltip }: NumericCellProps) {
	const content = <div className={cn(numericCellClassName, className)}>{children}</div>;
	if (tooltip == null || tooltip === "") return content;
	return <CellTooltip content={tooltip}>{content}</CellTooltip>;
}

type CellTooltipProps = {
	content: ReactNode;
	children: ReactNode;
	/** Radix side; default top. */
	side?: "top" | "right" | "bottom" | "left";
	className?: string;
	contentClassName?: string;
	/**
	 * Pass the child through as TooltipTrigger (for buttons / menu triggers).
	 * Default wraps non-interactive cell content in a span.
	 */
	asChild?: boolean;
};

/**
 * Shared shadcn Tooltip wrapper for table cells / action triggers.
 * Prefer this over native `title=` so styling and delay stay consistent.
 */
export function CellTooltip({
	content,
	children,
	side = "top",
	className,
	contentClassName,
	asChild = false
}: CellTooltipProps) {
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				{asChild ? (
					children
				) : (
					<span className={cn("inline-flex max-w-full cursor-default", className)}>{children}</span>
				)}
			</TooltipTrigger>
			<TooltipContent side={side} className={cn("max-w-xs text-pretty", contentClassName)}>
				{content}
			</TooltipContent>
		</Tooltip>
	);
}
