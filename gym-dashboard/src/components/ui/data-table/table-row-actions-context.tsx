"use client";

import * as React from "react";

/** Imperative handles registered by ItemActions for context menu / batch delete. */
export type RegisteredRowActions = {
	canEdit: boolean;
	canDelete: boolean;
	openEdit: () => void;
	openDelete: () => void;
	/** Direct delete (no dialog) — used by confirmed batch delete. */
	runDelete: () => Promise<void>;
	entityLabel: string;
};

type RowActionsRegistry = {
	register: (rowId: string, actions: RegisteredRowActions) => void;
	unregister: (rowId: string) => void;
	get: (rowId: string) => RegisteredRowActions | undefined;
};

const RowActionsRegistryContext = React.createContext<RowActionsRegistry | null>(null);

/**
 * Ref-backed registry (no React state) so ItemActions can register without
 * re-render loops. Consumers read at event time (context menu / batch bar).
 */
export function RowActionsRegistryProvider({ children }: { children: React.ReactNode }) {
	const mapRef = React.useRef(new Map<string, RegisteredRowActions>());

	const registry = React.useMemo<RowActionsRegistry>(
		() => ({
			register(rowId, actions) {
				mapRef.current.set(rowId, actions);
			},
			unregister(rowId) {
				mapRef.current.delete(rowId);
			},
			get(rowId) {
				return mapRef.current.get(rowId);
			},
		}),
		[]
	);

	return (
		<RowActionsRegistryContext.Provider value={registry}>{children}</RowActionsRegistryContext.Provider>
	);
}

export function useOptionalRowActionsRegistry(): RowActionsRegistry | null {
	return React.useContext(RowActionsRegistryContext);
}
