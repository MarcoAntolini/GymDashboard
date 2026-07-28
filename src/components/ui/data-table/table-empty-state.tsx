import * as React from "react";

type TableEmptyStateProps = {
	title: string;
	hint?: string;
	/** CTA opzionale (es. Reimposta filtri). */
	action?: React.ReactNode;
};

/** Empty state densità operativa: titolo + prossima azione plausibile. */
export function TableEmptyState({ title, hint, action }: TableEmptyStateProps) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 py-1 text-center">
			<div className="flex flex-col gap-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				{hint ? <p className="text-sm text-muted-foreground max-w-md">{hint}</p> : null}
			</div>
			{action ? <div className="pt-0.5">{action}</div> : null}
		</div>
	);
}
