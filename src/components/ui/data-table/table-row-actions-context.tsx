"use client";

import type { LucideIcon } from "lucide-react";
import * as React from "react";

export type RowExtraAction = {
	id: string;
	label: string;
	icon?: LucideIcon;
	destructive?: boolean;
	disabled?: boolean;
	onSelect: () => void;
};

export type RowRegisteredActions = {
	canEdit: boolean;
	canDelete: boolean;
	openEdit: () => void;
	openDelete: () => void;
	extraActions?: RowExtraAction[];
};

type RowActionsRegistry = {
	register: (rowId: string, actions: RowRegisteredActions) => void;
	unregister: (rowId: string) => void;
	get: (rowId: string) => RowRegisteredActions | undefined;
};

const RowActionsContext = React.createContext<RowActionsRegistry | null>(null);

export function RowActionsProvider({ children }: { children: React.ReactNode }) {
	const mapRef = React.useRef(new Map<string, RowRegisteredActions>());

	const register = React.useCallback((rowId: string, actions: RowRegisteredActions) => {
		mapRef.current.set(rowId, actions);
	}, []);

	const unregister = React.useCallback((rowId: string) => {
		mapRef.current.delete(rowId);
	}, []);

	const get = React.useCallback((rowId: string) => mapRef.current.get(rowId), []);

	const value = React.useMemo(
		() => ({ register, unregister, get }),
		[register, unregister, get]
	);

	return (
		<RowActionsContext.Provider value={value}>{children}</RowActionsContext.Provider>
	);
}

export function useRowActionsRegistry() {
	const ctx = React.useContext(RowActionsContext);
	if (!ctx) {
		throw new Error("useRowActionsRegistry must be used within RowActionsProvider");
	}
	return ctx;
}

/** Safe for ItemActions when outside provider (should not happen in DataTable). */
export function useOptionalRowActionsRegistry() {
	return React.useContext(RowActionsContext);
}
