"use client";

import {
	AlertDialog,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { RegisteredRowActions } from "@/components/ui/data-table/table-row-actions-context";
import type { Row, Table } from "@tanstack/react-table";
import { Copy, Loader2, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import * as React from "react";
import { toast } from "sonner";

type TableBatchBarProps<TData> = {
	table: Table<TData>;
	getRowActions: (rowId: string) => RegisteredRowActions | undefined;
	entityLabel?: string;
};

function rowEntityId(row: Row<unknown>): string {
	const original = row.original as { id?: string | number };
	if (original?.id != null) return String(original.id);
	return row.id;
}

export default function TableBatchBar<TData>({
	table,
	getRowActions,
	entityLabel = "record",
}: TableBatchBarProps<TData>) {
	const router = useRouter();
	const selectedRows = table.getSelectedRowModel().rows;
	const selectedCount = selectedRows.length;
	const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);

	if (selectedCount === 0) return null;

	const actionStates = selectedRows.map((row) => getRowActions(row.id));
	const allRegistered = actionStates.every((actions) => actions != null);
	const allCanDelete = allRegistered && actionStates.every((actions) => actions!.canDelete);

	const deleteDisabledReason = !allRegistered
		? "Azioni riga non ancora disponibili per tutte le selezioni."
		: !allCanDelete
			? "Una o più righe selezionate non consentono l'eliminazione."
			: null;

	async function copyIds() {
		const ids = selectedRows.map((row) => rowEntityId(row as Row<unknown>));
		try {
			await navigator.clipboard.writeText(ids.join("\n"));
			toast.success(
				ids.length === 1 ? "ID copiato negli appunti." : `${ids.length} ID copiati negli appunti.`
			);
		} catch {
			toast.error("Impossibile copiare gli ID.");
		}
	}

	async function onConfirmBatchDelete() {
		if (isDeleting || !allCanDelete) return;
		setIsDeleting(true);
		const failures: string[] = [];
		try {
			for (const row of selectedRows) {
				const actions = getRowActions(row.id);
				if (!actions?.canDelete) {
					failures.push(rowEntityId(row as Row<unknown>));
					continue;
				}
				try {
					await actions.runDelete();
				} catch {
					failures.push(rowEntityId(row as Row<unknown>));
				}
			}
			table.resetRowSelection();
			setIsDeleteOpen(false);
			router.refresh();
			if (failures.length === 0) {
				toast.success(
					selectedCount === 1
						? `${entityLabel} eliminato.`
						: `${selectedCount} ${entityLabel} eliminati.`
				);
			} else {
				toast.error(
					`Eliminazione incompleta: ${failures.length} di ${selectedCount} non eliminati (vincoli o errori).`
				);
			}
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<>
			<div
				className="mb-3 flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-primary/25 bg-primary/5 px-3 py-2"
				role="status"
				aria-live="polite"
			>
				<span className="text-sm font-medium text-foreground">
					{selectedCount === 1 ? "1 riga selezionata" : `${selectedCount} righe selezionate`}
				</span>
				<span className="hidden text-muted-foreground sm:inline" aria-hidden>
					·
				</span>
				<div className="flex flex-wrap items-center gap-2">
					<Button type="button" variant="outline" size="sm" className="h-8 gap-1.5" onClick={() => void copyIds()}>
						<Copy className="size-3.5" aria-hidden />
						Copia ID
					</Button>
					<span
						title={deleteDisabledReason ?? undefined}
						className="inline-flex"
					>
						<Button
							type="button"
							variant="outline"
							size="sm"
							className="h-8 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
							disabled={deleteDisabledReason != null}
							aria-disabled={deleteDisabledReason != null}
							onClick={() => setIsDeleteOpen(true)}
						>
							<Trash2 className="size-3.5" aria-hidden />
							Elimina
						</Button>
					</span>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						className="h-8 gap-1.5"
						onClick={() => table.resetRowSelection()}
					>
						<X className="size-3.5" aria-hidden />
						Deseleziona
					</Button>
				</div>
				{deleteDisabledReason ? (
					<p className="basis-full text-xs text-muted-foreground text-pretty">{deleteDisabledReason}</p>
				) : null}
			</div>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={(open) => {
					if (isDeleting) return;
					setIsDeleteOpen(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Eliminare {selectedCount === 1 ? `questo ${entityLabel}` : `questi ${selectedCount} ${entityLabel}`}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							L&apos;operazione non può essere annullata. Se esistono collegamenti protetti (Restrict),
							singole eliminazioni possono fallire.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
						<Button
							type="button"
							variant="destructive"
							disabled={isDeleting}
							aria-busy={isDeleting}
							onClick={() => {
								void onConfirmBatchDelete();
							}}
						>
							{isDeleting ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
							Elimina
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
