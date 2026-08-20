"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { createPortal } from "react-dom";

let measureCanvas: HTMLCanvasElement | null = null;

function measureTextWidth(text: string, font: string, letterSpacing: string): number {
	measureCanvas ??= document.createElement("canvas");
	const ctx = measureCanvas.getContext("2d");
	if (!ctx) return 0;
	ctx.font = font;
	try {
		ctx.letterSpacing =
			letterSpacing && letterSpacing !== "normal" ? letterSpacing : "0px";
	} catch {
		/* letterSpacing sul canvas non è ovunque supportato */
	}
	return ctx.measureText(text).width;
}

/**
 * `scrollWidth` con `text-overflow: ellipsis` in Chrome è spesso uguale a
 * `clientWidth` (falso negativo). Date/orari in un `div` interno cadono sempre lì.
 * Misuriamo la stringa con il font effettivo contro la larghezza visibile.
 */
function isOverflowing(el: HTMLElement): boolean {
	const text = (el.innerText ?? "").replace(/\s+/g, " ").trim();
	if (!text) return false;
	const available = el.clientWidth;
	if (available <= 0) return false;
	if (el.scrollWidth > available + 1) return true;
	const styled =
		(el.querySelector(":scope > *") as HTMLElement | null) ?? el;
	const cs = getComputedStyle(styled);
	const textWidth = measureTextWidth(text, cs.font, cs.letterSpacing);
	return textWidth > available + 1;
}

/**
 * Una sola riga con ellipsis. Se il contenuto sfora, un tooltip (portal su body)
 * mostra il testo completo — non usa Radix Tooltip, che si chiude sullo scroll
 * della tabella (`overflow: auto` + listener in capture).
 */
export function OverflowText({
	children,
	className,
	tooltipClassName,
}: {
	children: React.ReactNode;
	className?: string;
	tooltipClassName?: string;
}) {
	const visibleRef = React.useRef<HTMLDivElement>(null);
	const [open, setOpen] = React.useState(false);
	const [fullText, setFullText] = React.useState("");
	const [pos, setPos] = React.useState<{
		top: number;
		left: number;
		side: "top" | "bottom";
	}>({ top: 0, left: 0, side: "top" });

	const close = React.useCallback(() => setOpen(false), []);

	const tryOpen = React.useCallback(() => {
		const el = visibleRef.current;
		if (!el) return;
		const text = (el.innerText ?? "").replace(/\s+/g, " ").trim();
		if (!text || !isOverflowing(el)) {
			setOpen(false);
			return;
		}
		const rect = el.getBoundingClientRect();
		const side: "top" | "bottom" = rect.top > 88 ? "top" : "bottom";
		setFullText(text);
		setPos({
			left: Math.max(8, rect.left),
			top: side === "top" ? rect.top - 6 : rect.bottom + 6,
			side,
		});
		setOpen(true);
	}, []);

	React.useEffect(() => {
		if (!open) return;
		const onKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") close();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, close]);

	return (
		<div
			className="relative flex h-full min-w-0 w-full max-w-full items-center"
			onMouseEnter={tryOpen}
			onMouseLeave={close}
		>
			<div
				ref={visibleRef}
				className={cn(
					"min-w-0 w-full truncate [&>*]:min-w-0 [&>*]:max-w-full [&>div]:truncate",
					className
				)}
			>
				{children}
			</div>
			{open && fullText
				? createPortal(
						<div
							role="tooltip"
							className={cn(
								"pointer-events-none z-50 max-h-64 max-w-[min(20rem,calc(100vw-2rem))] overflow-y-auto rounded-md border bg-popover px-3 py-1.5 text-left text-sm font-normal text-popover-foreground shadow-md whitespace-pre-wrap break-words",
								"motion-safe:animate-in motion-safe:fade-in-0 motion-safe:zoom-in-95",
								tooltipClassName
							)}
							style={{
								position: "fixed",
								top: pos.top,
								left: pos.left,
								transform:
									pos.side === "top" ? "translateY(-100%)" : undefined,
							}}
						>
							{fullText}
						</div>,
						document.body
					)
				: null}
		</div>
	);
}
