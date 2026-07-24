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
import { runBulkDeletes } from "@/lib/domain/bulk-delete";
import { Loader2 } from "lucide-react";
import * as React from "react";
import { toast } from "sonner";

const DEFAULT_DELETE_CONSEQUENCE =
	"L'eliminazione è permanente. Se esistono record collegati (vincolo Restrict), l'operazione verrà rifiutata.";

export type TableBulkBarProps<TData> = {
	selectedRows: TData[];
	entityLabel: string;
	deleteConsequence?: string;
	deleteRow: (row: TData) => Promise<void>;
	onDeleted?: () => void | Promise<void>;
	onClearSelection: () => void;
	/** Extra bulk actions (e.g. Approva) rendered beside Elimina. */
	extraActions?: React.ReactNode;
};

/**
 * Selection toolbar: count + bulk Elimina (confirm + per-row Restrict toasts).
 */
export function TableBulkBar<TData>({
	selectedRows,
	entityLabel,
	deleteConsequence,
	deleteRow,
	onDeleted,
	onClearSelection,
	extraActions,
}: TableBulkBarProps<TData>) {
	const [confirmOpen, setConfirmOpen] = React.useState(false);
	const [isDeleting, setIsDeleting] = React.useState(false);
	const count = selectedRows.length;

	if (count === 0) return null;

	async function runBulkDelete() {
		setIsDeleting(true);
		try {
			const { ok, errors } = await runBulkDeletes(selectedRows, deleteRow);
			for (const message of errors) {
				toast.error(message);
			}
			if (ok > 0) {
				toast.success(
					ok === 1
						? `${entityLabel} eliminato.`
						: `${ok} ${entityLabel} eliminati.`
				);
				await onDeleted?.();
			}
			setConfirmOpen(false);
			onClearSelection();
		} finally {
			setIsDeleting(false);
		}
	}

	return (
		<>
			<div
				role="region"
				aria-label="Azioni di selezione multipla"
				className="mb-2 flex flex-wrap items-center gap-2 rounded-md border bg-muted/40 px-3 py-2"
			>
				<span className="text-sm text-muted-foreground">
					{count === 1 ? "1 selezionato" : `${count} selezionati`}
				</span>
				<div className="flex flex-wrap items-center gap-2">
					{extraActions}
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={() => setConfirmOpen(true)}
					>
						Elimina
					</Button>
					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={onClearSelection}
					>
						Annulla selezione
					</Button>
				</div>
			</div>

			<AlertDialog
				open={confirmOpen}
				onOpenChange={(open) => {
					if (!open && isDeleting) return;
					setConfirmOpen(open);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Eliminare {count === 1 ? `questo ${entityLabel}` : `${count} ${entityLabel}`}?
						</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteConsequence ?? DEFAULT_DELETE_CONSEQUENCE}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
						<Button
							variant="destructive"
							disabled={isDeleting}
							onClick={() => {
								void runBulkDelete();
							}}
						>
							{isDeleting ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								"Elimina"
							)}
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
