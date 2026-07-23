"use client";

import DashboardPlaceholder from "@/components/ui/dashboard-placeholder";
import type { ReactNode } from "react";

type EntityShellProps = {
	isLoading: boolean;
	error: Error | null;
	onRetry: () => void;
	/** Domain noun for error copy (Cliente, Ingresso, …). */
	entityLabel?: string;
	children: ReactNode;
};

/**
 * Shared loading / error gate for entity list pages.
 * Success renders children (typically `<Dashboard />`); failure never leaves an infinite spinner.
 */
export function EntityShell({
	isLoading,
	error,
	onRetry,
	entityLabel,
	children
}: EntityShellProps) {
	if (isLoading) {
		return <DashboardPlaceholder variant="loading" entityLabel={entityLabel} />;
	}

	if (error) {
		return (
			<DashboardPlaceholder
				variant="error"
				error={error}
				onRetry={onRetry}
				entityLabel={entityLabel}
			/>
		);
	}

	return <>{children}</>;
}
