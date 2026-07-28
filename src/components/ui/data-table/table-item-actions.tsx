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
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	useOptionalRowActionsRegistry,
	type RowExtraAction,
} from "@/components/ui/data-table/table-row-actions-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { Row } from "@tanstack/react-table";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

function mutationErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

export default function ItemActions<TFormSchema extends z.ZodType<any, any>>({
	row,
	formSchema,
	editFormContent,
	editAction,
	deleteAction,
	entityLabel,
	editTitle,
	editDescription,
	deleteTitle,
	deleteDescription,
	editUnavailable,
	deleteUnavailable,
	/** @deprecated typo — use editUnavailable */
	editUnavailabe,
	/** @deprecated typo — use deleteUnavailable */
	deleteUnavailabe,
	extraMenuItems,
}: {
	row: Row<any>;
	formSchema: TFormSchema;
	editFormContent: React.ReactNode;
	editAction: (params: { values: z.infer<TFormSchema> }) => Promise<any>;
	deleteAction: () => Promise<void>;
	/** Domain noun for default copy (es. "Cliente", "Pagamento"). */
	entityLabel?: string;
	editTitle?: string;
	editDescription?: string;
	deleteTitle?: string;
	deleteDescription?: string;
	editUnavailable?: boolean;
	deleteUnavailable?: boolean;
	editUnavailabe?: boolean;
	deleteUnavailabe?: boolean;
	/** Azioni extra (dropdown + context menu), es. Approva. */
	extraMenuItems?: RowExtraAction[];
}) {
	const editBlocked = editUnavailable ?? editUnavailabe;
	const deleteBlocked = deleteUnavailable ?? deleteUnavailabe;

	const label = entityLabel ?? "record";
	const resolvedEditTitle = editTitle ?? `Modifica ${label}`;
	const resolvedEditDescription =
		editDescription ?? `Aggiorna i dati del ${label}.`;
	const resolvedDeleteTitle = deleteTitle ?? `Eliminare questo ${label}?`;
	const resolvedDeleteDescription =
		deleteDescription ??
		`L'eliminazione è definitiva. Se esistono record collegati (Restrict), l'operazione verrà rifiutata.`;

	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isEditSubmitting, setIsEditSubmitting] = useState(false);
	const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

	const router = useRouter();
	const registry = useOptionalRowActionsRegistry();

	const form = useForm<z.infer<TFormSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			...row.original,
		},
	});

	useEffect(() => {
		if (!isEditOpen) return;
		form.reset({ ...row.original });
		setIsEditSubmitting(false);
		// Reset only when the sheet opens — not on every row identity refresh.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional open-gated reset
	}, [isEditOpen]);

	// Keep registry in sync each render; cleanup only on unmount / row id change.
	if (registry) {
		registry.register(row.id, {
			canEdit: !editBlocked,
			canDelete: !deleteBlocked,
			openEdit: () => setIsEditOpen(true),
			openDelete: () => setIsDeleteOpen(true),
			extraActions: extraMenuItems,
		});
	}
	useEffect(() => {
		const rowId = row.id;
		return () => registry?.unregister(rowId);
	}, [registry, row.id]);

	async function onEditSubmit(values: z.infer<TFormSchema>) {
		setIsEditSubmitting(true);
		try {
			await editAction({ values });
			setIsEditOpen(false);
			router.refresh();
		} catch (error) {
			toast.error(mutationErrorMessage(error, `Impossibile modificare il ${label}.`));
		} finally {
			setIsEditSubmitting(false);
		}
	}

	async function onDeleteSubmit(event: React.MouseEvent) {
		event.preventDefault();
		setIsDeleteSubmitting(true);
		try {
			await deleteAction();
			setIsDeleteOpen(false);
			router.refresh();
		} catch (error) {
			toast.error(mutationErrorMessage(error, `Impossibile eliminare il ${label}.`));
		} finally {
			setIsDeleteSubmitting(false);
		}
	}

	function handleEditOpenChange(open: boolean) {
		if (isEditSubmitting && !open) return;
		setIsEditOpen(open);
	}

	function handleDeleteOpenChange(open: boolean) {
		if (isDeleteSubmitting && !open) return;
		setIsDeleteOpen(open);
	}

	const hasExtra = (extraMenuItems?.length ?? 0) > 0;
	const canPin = row.getCanPin?.() ?? false;
	const isPinned = row.getIsPinned?.() ?? false;
	const menuDisabled =
		!!editBlocked && !!deleteBlocked && !hasExtra && !canPin;

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="h-7 w-7 p-0"
						disabled={menuDisabled}
					>
						<span className="sr-only">Apri menu</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Azioni</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{!editBlocked && (
						<DropdownMenuItem onClick={() => setIsEditOpen(true)}>Modifica</DropdownMenuItem>
					)}
					{extraMenuItems?.map((item) => (
						<DropdownMenuItem
							key={item.id}
							disabled={item.disabled}
							className={item.destructive ? "text-destructive focus:text-destructive" : undefined}
							onClick={item.onSelect}
						>
							{item.label}
						</DropdownMenuItem>
					))}
					{!deleteBlocked && (
						<DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>Elimina</DropdownMenuItem>
					)}
					{canPin ? (
						<>
							{(!editBlocked || !deleteBlocked || hasExtra) && (
								<DropdownMenuSeparator />
							)}
							{isPinned ? (
								<DropdownMenuItem onClick={() => row.pin(false)}>
									Sblocca riga
								</DropdownMenuItem>
							) : (
								<DropdownMenuItem onClick={() => row.pin("top")}>
									Fissa in alto
								</DropdownMenuItem>
							)}
						</>
					) : null}
				</DropdownMenuContent>
			</DropdownMenu>

			<Sheet
				open={isEditOpen}
				onOpenChange={handleEditOpenChange}
			>
				<SheetContent
					side="right"
					className="flex w-full flex-col sm:max-w-md overflow-y-auto"
					onPointerDownOutside={(e) => {
						if (isEditSubmitting) e.preventDefault();
					}}
					onEscapeKeyDown={(e) => {
						if (isEditSubmitting) e.preventDefault();
					}}
				>
					<SheetHeader>
						<SheetTitle>{resolvedEditTitle}</SheetTitle>
						<SheetDescription>{resolvedEditDescription}</SheetDescription>
					</SheetHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onEditSubmit)}
							className="mt-6 flex flex-1 flex-col gap-6"
						>
							<div className="flex flex-col gap-4">{editFormContent}</div>
							<SheetFooter className="mt-auto">
								<Button
									type="submit"
									disabled={isEditSubmitting}
								>
									{isEditSubmitting ? (
										<>
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Salvataggio…
										</>
									) : (
										"Salva"
									)}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>

			<AlertDialog
				open={isDeleteOpen}
				onOpenChange={handleDeleteOpenChange}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{resolvedDeleteTitle}</AlertDialogTitle>
						<AlertDialogDescription>{resolvedDeleteDescription}</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel
							disabled={isDeleteSubmitting}
							onClick={() => setIsDeleteOpen(false)}
						>
							Annulla
						</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90"
							disabled={isDeleteSubmitting}
							onClick={onDeleteSubmit}
						>
							{isDeleteSubmitting ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Eliminazione…
								</>
							) : (
								"Elimina"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
