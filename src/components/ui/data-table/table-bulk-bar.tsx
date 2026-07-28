"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export type DataTableBulkAction<TData> = {
	id: string;
	label: string;
	variant?: "default" | "destructive";
	/** Se false, azione nascosta per la selezione corrente. */
	isAvailable?: (rows: TData[]) => boolean;
	/** Sottoinsieme su cui eseguire (default: tutte le selezionate). */
	filterRows?: (rows: TData[]) => TData[];
	run: (row: TData) => Promise<void>;
	confirmTitle?: string | ((count: number) => string);
	confirmDescription?: string | ((count: number) => string);
};

function mutationErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

async function runSequential<TData>(
	rows: TData[],
	run: (row: TData) => Promise<void>,
	failFallback: string
) {
	let ok = 0;
	let fail = 0;
	for (const row of rows) {
		try {
			await run(row);
			ok += 1;
		} catch (error) {
			fail += 1;
			toast.error(mutationErrorMessage(error, failFallback));
		}
	}
	return { ok, fail };
}

export function TableBulkBar<TData>({
	selectedRows,
	entityLabel,
	bulkDeleteRow,
	bulkActions,
	onComplete,
	onClearSelection,
}: {
	selectedRows: TData[];
	entityLabel: string;
	bulkDeleteRow?: (row: TData) => Promise<void>;
	bulkActions?: DataTableBulkAction<TData>[];
	onComplete: () => void;
	onClearSelection: () => void;
}) {
	const count = selectedRows.length;
	const [pendingAction, setPendingAction] = useState<"delete" | string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	if (count === 0) return null;

	const availableExtra = (bulkActions ?? []).filter(
		(action) => action.isAvailable?.(selectedRows) ?? true
	);

	const confirmTitle =
		pendingAction === "delete"
			? `Eliminare ${count} ${entityLabel}?`
			: (() => {
					const action = availableExtra.find((a) => a.id === pendingAction);
					if (!action?.confirmTitle) return action?.label ?? "Confermare?";
					return typeof action.confirmTitle === "function"
						? action.confirmTitle(count)
						: action.confirmTitle;
				})();

	const confirmDescription =
		pendingAction === "delete"
			? `L'eliminazione è definitiva. Se esistono record collegati (Restrict), le operazioni verranno rifiutate singolarmente.`
			: (() => {
					const action = availableExtra.find((a) => a.id === pendingAction);
					if (!action?.confirmDescription) {
						return `Confermi l'azione su ${count} elementi selezionati?`;
					}
					return typeof action.confirmDescription === "function"
						? action.confirmDescription(count)
						: action.confirmDescription;
				})();

	async function handleConfirm() {
		if (!pendingAction) return;
		setIsSubmitting(true);
		try {
			if (pendingAction === "delete" && bulkDeleteRow) {
				const { ok } = await runSequential(
					selectedRows,
					bulkDeleteRow,
					`Impossibile eliminare il ${entityLabel}.`
				);
				if (ok > 0) {
					toast.success(
						ok === 1
							? `1 ${entityLabel} eliminato.`
							: `${ok} elementi eliminati.`
					);
				}
			} else {
				const action = availableExtra.find((a) => a.id === pendingAction);
				if (action) {
					const targetRows = action.filterRows
						? action.filterRows(selectedRows)
						: selectedRows;
					const { ok } = await runSequential(
						targetRows,
						action.run,
						`Impossibile completare «${action.label}».`
					);
					if (ok > 0) {
						toast.success(
							ok === 1
								? `1 elemento aggiornato.`
								: `${ok} elementi aggiornati.`
						);
					}
				}
			}
			onComplete();
			onClearSelection();
			setPendingAction(null);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<>
			<div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-sm">
				<span className="font-medium tabular-nums">
					{count} selezionat{count === 1 ? "o" : "i"}
				</span>
				<div className="ml-auto flex flex-wrap items-center gap-2">
					{availableExtra.map((action) => (
						<Button
							key={action.id}
							type="button"
							size="sm"
							variant={action.variant === "destructive" ? "destructive" : "secondary"}
							onClick={() => setPendingAction(action.id)}
						>
							{action.label}
						</Button>
					))}
					{bulkDeleteRow ? (
						<Button
							type="button"
							size="sm"
							variant="destructive"
							onClick={() => setPendingAction("delete")}
						>
							Elimina
						</Button>
					) : null}
					<Button
						type="button"
						size="sm"
						variant="ghost"
						onClick={onClearSelection}
					>
						Annulla selezione
					</Button>
				</div>
			</div>

			<AlertDialog
				open={pendingAction != null}
				onOpenChange={(open) => {
					if (isSubmitting && !open) return;
					if (!open) setPendingAction(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
						<AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isSubmitting}>Annulla</AlertDialogCancel>
						<AlertDialogAction
							className={
								pendingAction === "delete" ||
								availableExtra.find((a) => a.id === pendingAction)?.variant ===
									"destructive"
									? "bg-destructive hover:bg-destructive/90"
									: undefined
							}
							disabled={isSubmitting}
							onClick={(event) => {
								event.preventDefault();
								void handleConfirm();
							}}
						>
							{isSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									In corso…
								</>
							) : pendingAction === "delete" ? (
								"Elimina"
							) : (
								"Conferma"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
