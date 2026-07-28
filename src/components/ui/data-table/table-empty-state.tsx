import * as React from "react";

type TableEmptyStateProps = {
	title: string;
	hint?: string;
};

/** Empty state densità operativa: titolo + prossima azione plausibile. */
export function TableEmptyState({ title, hint }: TableEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-1 py-1 text-center">
			<p className="text-sm font-medium text-foreground">{title}</p>
			{hint ? <p className="text-sm text-muted-foreground max-w-md">{hint}</p> : null}
		</div>
	);
}
