"use client";

import * as React from "react";

export type RowActionHandlers = {
	openEdit?: () => void;
	openDelete?: () => void;
	canEdit: boolean;
	canDelete: boolean;
};

type RowActionsContextValue = {
	setHandlers: (handlers: RowActionHandlers | null) => void;
};

const RowActionsContext = React.createContext<RowActionsContextValue | null>(
	null
);

/** Per-row registry so the context menu can mirror ItemActions (Modifica/Elimina). */
export function RowActionsProvider({
	children,
	onHandlersChange,
}: {
	children: React.ReactNode;
	onHandlersChange: (handlers: RowActionHandlers | null) => void;
}) {
	const setHandlers = React.useCallback(
		(handlers: RowActionHandlers | null) => {
			onHandlersChange(handlers);
		},
		[onHandlersChange]
	);

	const value = React.useMemo(() => ({ setHandlers }), [setHandlers]);

	return (
		<RowActionsContext.Provider value={value}>
			{children}
		</RowActionsContext.Provider>
	);
}

export function useRegisterRowActions(handlers: RowActionHandlers) {
	const ctx = React.useContext(RowActionsContext);

	React.useEffect(() => {
		if (!ctx) return;
		ctx.setHandlers(handlers);
		return () => ctx.setHandlers(null);
		// Intentionally depend on stable handler identities from the row actions cell.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- register when capability / openers change
	}, [
		ctx,
		handlers.canEdit,
		handlers.canDelete,
		handlers.openEdit,
		handlers.openDelete,
	]);
}
