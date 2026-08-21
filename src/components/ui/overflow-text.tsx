"use client";

import { cn } from "@/lib/utils";
import * as React from "react";
import { createPortal } from "react-dom";

function contentBoxWidth(el: HTMLElement): number {
	const cs = getComputedStyle(el);
	const rect = el.getBoundingClientRect();
	return (
		rect.width -
		parseFloat(cs.paddingLeft) -
		parseFloat(cs.paddingRight) -
		parseFloat(cs.borderLeftWidth) -
		parseFloat(cs.borderRightWidth)
	);
}

/** Stesso motore di layout del testo visibile (canvas/kerning divergono dalle date). */
function measureRenderedTextWidth(text: string, sample: HTMLElement): number {
	const cs = getComputedStyle(sample);
	const probe = document.createElement("span");
	probe.textContent = text;
	probe.setAttribute("aria-hidden", "true");
	Object.assign(probe.style, {
		position: "absolute",
		visibility: "hidden",
		whiteSpace: "nowrap",
		top: "0",
		left: "0",
		font: cs.font,
		letterSpacing: cs.letterSpacing,
		wordSpacing: cs.wordSpacing,
		textTransform: cs.textTransform,
		fontKerning: cs.fontKerning,
		fontFeatureSettings: cs.fontFeatureSettings,
		fontVariationSettings: cs.fontVariationSettings,
	});
	document.body.appendChild(probe);
	const width = probe.getBoundingClientRect().width;
	probe.remove();
	return width;
}

/**
 * `scrollWidth`/`clientWidth` sono interi: con `text-overflow: ellipsis` Chrome
 * dipinge i puntini già con overflow subpixel (tipico date/orari), mentre
 * `scrollWidth === clientWidth`. Una soglia `+1` allargava quel buco.
 */
function isOverflowing(el: HTMLElement): boolean {
	const text = (el.innerText ?? "").replace(/\s+/g, " ").trim();
	if (!text) return false;
	const clipEl =
		(el.querySelector(":scope > *") as HTMLElement | null) ?? el;
	const available = contentBoxWidth(clipEl);
	if (available <= 0) return false;
	if (el.scrollWidth > el.clientWidth) return true;
	if (clipEl !== el && clipEl.scrollWidth > clipEl.clientWidth) return true;
	const textWidth = measureRenderedTextWidth(text, clipEl);
	return textWidth > available - 1;
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
