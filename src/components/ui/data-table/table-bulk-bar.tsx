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
import { Separator } from "@/components/ui/separator";
import { Loader2, Trash2, X, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export type DataTableBulkAction<TData> = {
	id: string;
	label: string;
	icon?: LucideIcon;
	variant?: "default" | "destructive" | "success";
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

function actionTargetRows<TData>(action: DataTableBulkAction<TData>, rows: TData[]) {
	return action.filterRows ? action.filterRows(rows) : rows;
}

function isTypingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
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

	const availableExtra = (bulkActions ?? []).filter(
		(action) => action.isAvailable?.(selectedRows) ?? true
	);
	const hasActions = availableExtra.length > 0 || !!bulkDeleteRow;

	const pendingExtra =
		pendingAction && pendingAction !== "delete"
			? availableExtra.find((action) => action.id === pendingAction)
			: undefined;
	const pendingCount =
		pendingAction === "delete"
			? count
			: pendingExtra
				? actionTargetRows(pendingExtra, selectedRows).length
				: count;

	useEffect(() => {
		if (count === 0) return;

		function onKeyDown(event: KeyboardEvent) {
			if (event.key !== "Escape" || event.defaultPrevented) return;
			if (pendingAction != null || isTypingTarget(event.target)) return;
			event.preventDefault();
			onClearSelection();
		}

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [count, pendingAction, onClearSelection]);

	const confirmTitle =
		pendingAction === "delete"
			? `Eliminare ${pendingCount} ${entityLabel}?`
			: (() => {
					if (!pendingExtra?.confirmTitle) return pendingExtra?.label ?? "Confermare?";
					return typeof pendingExtra.confirmTitle === "function"
						? pendingExtra.confirmTitle(pendingCount)
						: pendingExtra.confirmTitle;
				})();

	const confirmDescription =
		pendingAction === "delete"
			? `L'eliminazione è definitiva. Se esistono record collegati (Restrict), le operazioni verranno rifiutate singolarmente.`
			: (() => {
					if (!pendingExtra?.confirmDescription) {
						return `Confermi l'azione su ${pendingCount} elementi selezionati?`;
					}
					return typeof pendingExtra.confirmDescription === "function"
						? pendingExtra.confirmDescription(pendingCount)
						: pendingExtra.confirmDescription;
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
					const targetRows = actionTargetRows(action, selectedRows);
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
			<div className="flex min-h-9 flex-wrap items-center gap-x-3 gap-y-2 text-sm">
				{count > 0 ? (
					<>
						<div className="flex shrink-0 items-center gap-1">
							<span className="text-muted-foreground" aria-live="polite">
								<span className="font-medium tabular-nums text-foreground">
									{count}
								</span>{" "}
								selezionat{count === 1 ? "o" : "i"}
							</span>
							<Button
								type="button"
								size="sm"
								variant="ghost"
								className="text-muted-foreground"
								onClick={onClearSelection}
							>
								<X className="mr-1.5 h-3.5 w-3.5" />
								Deseleziona
							</Button>
						</div>
						{hasActions ? (
							<>
								<Separator
									orientation="vertical"
									className="hidden h-4 self-center sm:block"
								/>
								<div className="flex flex-wrap items-center gap-2">
									{availableExtra.map((action) => {
										const Icon = action.icon;
										const targetCount = actionTargetRows(action, selectedRows)
											.length;
										const showTargetCount = targetCount !== count;
										return (
											<Button
												key={action.id}
												type="button"
												size="sm"
												variant={
													action.variant === "destructive"
														? "destructive"
														: action.variant === "success"
															? "success"
															: "secondary"
												}
												onClick={() => setPendingAction(action.id)}
											>
												{Icon ? (
													<Icon className="mr-1.5 h-3.5 w-3.5" />
												) : null}
												{action.label}
												{showTargetCount ? ` (${targetCount})` : ""}
											</Button>
										);
									})}
									{bulkDeleteRow ? (
										<Button
											type="button"
											size="sm"
											variant="destructive"
											onClick={() => setPendingAction("delete")}
										>
											<Trash2 className="mr-1.5 h-3.5 w-3.5" />
											Elimina
										</Button>
									) : null}
								</div>
							</>
						) : null}
					</>
				) : null}
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
								pendingExtra?.variant === "destructive"
									? "bg-destructive hover:bg-destructive/90"
									: pendingExtra?.variant === "success"
										? "bg-success hover:bg-success/90"
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
