"use client";

import { useSearchHighlightTerm } from "@/components/ui/data-table/search-highlight-context";
import { splitHighlightMatches } from "@/lib/highlight-matches";
import { cn } from "@/lib/utils";
import * as React from "react";

type HighlightTextProps = {
	text: string;
	/** Chiavi in `appliedFilters` (di solito = id colonna / allowlist filtro). */
	filterKeys: string | string[];
	className?: string;
	as?: "span" | "div";
};

/**
 * Evidenzia i match del filtro server-side applicato nel testo della cella.
 * Solo termini da `appliedFilters` (non draft) — niente highlight prima di Filtra.
 */
export function HighlightText({
	text,
	filterKeys,
	className,
	as: Comp = "span",
}: HighlightTextProps) {
	const term = useSearchHighlightTerm(filterKeys);
	const segments = React.useMemo(
		() => splitHighlightMatches(text, term ?? ""),
		[text, term]
	);

	if (!term) {
		return <Comp className={className}>{text}</Comp>;
	}

	return (
		<Comp className={className}>
			{segments.map((segment, index) =>
				segment.match ? (
					<mark
						key={index}
						className="rounded-[2px] bg-warning/25 text-foreground"
					>
						{segment.text}
					</mark>
				) : (
					<React.Fragment key={index}>{segment.text}</React.Fragment>
				)
			)}
		</Comp>
	);
}

/** Cella default: stringifica il value e evidenzia se la colonna ha un filtro applicato. */
export function HighlightValueCell({
	value,
	filterKeys,
	className,
}: {
	value: unknown;
	filterKeys: string | string[];
	className?: string;
}) {
	if (value == null) return null;
	const text = String(value);
	return <HighlightText text={text} filterKeys={filterKeys} className={cn(className)} />;
}
