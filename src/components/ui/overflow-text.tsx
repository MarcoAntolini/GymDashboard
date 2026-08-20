"use client";

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as React from "react";

function contentWidth(node: HTMLElement | null): number {
	if (!node) return 0;
	return Math.ceil(node.scrollWidth);
}

/**
 * Una sola riga con ellipsis. Se il contenuto sfora, un Popover mostra il testo
 * completo con a capo (`whitespace-pre-wrap` + `break-words`).
 */
export function OverflowText({
	children,
	className,
	popoverClassName,
}: {
	children: React.ReactNode;
	className?: string;
	popoverClassName?: string;
}) {
	const visibleRef = React.useRef<HTMLDivElement>(null);
	const sizerRef = React.useRef<HTMLDivElement>(null);
	const [overflowing, setOverflowing] = React.useState(false);
	const [fullText, setFullText] = React.useState("");

	const measure = React.useCallback(() => {
		const visible = visibleRef.current;
		const sizer = sizerRef.current;
		if (!visible || !sizer) return;
		const next = contentWidth(sizer) > Math.ceil(visible.clientWidth) + 1;
		setOverflowing(next);
		const text = (sizer.innerText ?? "").trim();
		setFullText(text);
	}, []);

	React.useLayoutEffect(() => {
		measure();
		const visible = visibleRef.current;
		if (!visible) return;
		const observer = new ResizeObserver(() => measure());
		observer.observe(visible);
		return () => observer.disconnect();
	}, [measure, children]);

	const line = (
		<div
			ref={visibleRef}
			className={cn(
				"min-w-0 w-full truncate [&>*]:min-w-0 [&>*]:max-w-full [&>div]:truncate",
				className
			)}
		>
			{children}
		</div>
	);

	return (
		<div className="relative flex h-full min-w-0 w-full max-w-full items-center">
			<div
				ref={sizerRef}
				aria-hidden
				className="pointer-events-none invisible absolute left-0 top-0 h-px w-max max-w-none overflow-hidden whitespace-nowrap [&_*]:max-w-none"
			>
				{children}
			</div>
			{overflowing && fullText ? (
				<Popover>
					<PopoverTrigger asChild>
						<button
							type="button"
							className="min-w-0 w-full rounded-sm text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="Mostra testo completo"
						>
							{line}
						</button>
					</PopoverTrigger>
					<PopoverContent
						align="start"
						className={cn(
							"w-80 max-w-[min(20rem,calc(100vw-2rem))] p-3",
							popoverClassName
						)}
					>
						<p className="whitespace-pre-wrap break-all text-sm">{fullText}</p>
					</PopoverContent>
				</Popover>
			) : (
				line
			)}
		</div>
	);
}
