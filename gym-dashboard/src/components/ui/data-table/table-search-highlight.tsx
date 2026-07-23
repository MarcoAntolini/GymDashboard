"use client";

import * as React from "react";

/**
 * Render-only search highlight for DataTable cells.
 * Filtering/search stays DB-side (ListQuery); this only wraps matching substrings.
 */

export function collectTextSearchTerms(
	columnFilters: Array<{ id: string; value: unknown }>,
	textFilterIds: string[]
): string[] {
	const textSet = new Set(textFilterIds);
	const terms: string[] = [];
	for (const filter of columnFilters) {
		if (!textSet.has(filter.id)) continue;
		if (typeof filter.value !== "string") continue;
		const trimmed = filter.value.trim();
		if (trimmed) terms.push(trimmed);
	}
	return terms;
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Split `text` into plain + <mark> segments for case-insensitive multi-term match. */
export function highlightText(text: string, terms: string[]): React.ReactNode {
	const usable = terms.map((t) => t.trim()).filter(Boolean);
	if (!usable.length || !text) return text;

	const pattern = new RegExp(`(${usable.map(escapeRegExp).join("|")})`, "gi");
	const parts = text.split(pattern);
	if (parts.length === 1) return text;

	const lowerTerms = usable.map((t) => t.toLowerCase());
	return parts.map((part, index) => {
		if (!part) return null;
		const isMatch = lowerTerms.some((t) => part.toLowerCase() === t);
		if (!isMatch) return <React.Fragment key={index}>{part}</React.Fragment>;
		return (
			<mark
				key={index}
				className="rounded-sm bg-primary/25 px-0.5 text-foreground dark:bg-primary/35"
			>
				{part}
			</mark>
		);
	});
}

/**
 * Walk React children and highlight string / number leaves.
 * Skips interactive subtrees (buttons, inputs, menus) so actions stay untouched.
 */
export function highlightReactNode(node: React.ReactNode, terms: string[]): React.ReactNode {
	if (!terms.length || node == null || typeof node === "boolean") return node;

	if (typeof node === "string" || typeof node === "number") {
		return highlightText(String(node), terms);
	}

	if (Array.isArray(node)) {
		return node.map((child, index) => (
			<React.Fragment key={index}>{highlightReactNode(child, terms)}</React.Fragment>
		));
	}

	if (!React.isValidElement(node)) return node;

	const type = node.type;
	const skipTypes = new Set(["button", "input", "select", "textarea", "a", "svg"]);
	if (typeof type === "string" && skipTypes.has(type)) return node;

	const props = node.props as { children?: React.ReactNode; className?: string };
	// Heuristic: action / control wrappers — don't rewrite their labels.
	if (
		typeof props.className === "string" &&
		/\b(dropdown-menu|sr-only)\b/.test(props.className)
	) {
		return node;
	}

	if (props.children == null) return node;

	return React.cloneElement(node, {
		...props,
		children: highlightReactNode(props.children, terms),
	} as never);
}
