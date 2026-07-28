"use client";

import Link from "next/link";

/**
 * Toolbar hint when the entity is created from another flow (no local create Dialog).
 */
export function CreateElsewhereHint({
	message,
	href,
	linkLabel,
}: {
	message: string;
	href: string;
	linkLabel: string;
}) {
	return (
		<p className="text-sm text-muted-foreground">
			{message}{" "}
			<Link
				href={href}
				className="font-medium text-foreground underline underline-offset-4 hover:text-primary"
			>
				{linkLabel}
			</Link>
		</p>
	);
}
