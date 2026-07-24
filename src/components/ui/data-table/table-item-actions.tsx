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
import { useRegisterRowActions } from "@/components/ui/data-table/row-actions-context";
import { zodResolver } from "@hookform/resolvers/zod";
import { Row } from "@tanstack/react-table";
import { Loader2, MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

export default function ItemActions<TFormSchema extends z.ZodType<any, any>>({
	row,
	formSchema,
	editFormContent,
	editAction,
	deleteAction,
	entityLabel,
	deleteConsequence,
	editUnavailabe,
	deleteUnavailabe,
}: {
	row: Row<any>;
	formSchema: TFormSchema;
	editFormContent: React.ReactNode;
	editAction: (params: { values: z.infer<TFormSchema> }) => Promise<any>;
	deleteAction: () => Promise<void>;
	/** Domain entity name (Cliente, Pagamento, …). */
	entityLabel: string;
	/** Optional Restrict / consequence note shown in the delete confirm. */
	deleteConsequence?: string;
	editUnavailabe?: boolean;
	deleteUnavailabe?: boolean;
}) {
	const [isEditOpen, setIsEditOpen] = useState(false);
	const [isDeleteOpen, setIsDeleteOpen] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);

	const router = useRouter();

	const form = useForm<z.infer<TFormSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			...row.original,
		},
	});

	useEffect(() => {
		if (isEditOpen) {
			form.reset({ ...row.original });
		} else {
			setIsSaving(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when sheet opens / row changes
	}, [isEditOpen, row.original]);

	const openEdit = useCallback(() => setIsEditOpen(true), []);
	const openDelete = useCallback(() => setIsDeleteOpen(true), []);

	useRegisterRowActions({
		canEdit: !editUnavailabe,
		canDelete: !deleteUnavailabe,
		openEdit: editUnavailabe ? undefined : openEdit,
		openDelete: deleteUnavailabe ? undefined : openDelete,
	});

	async function onEditSubmit(values: z.infer<TFormSchema>) {
		setIsSaving(true);
		try {
			await editAction({ values });
			setIsEditOpen(false);
			toast.success(`${entityLabel} aggiornato.`);
			router.refresh();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Modifica non riuscita.";
			toast.error(message);
		} finally {
			setIsSaving(false);
		}
	}

	async function onDeleteSubmit() {
		setIsDeleting(true);
		try {
			await deleteAction();
			setIsDeleteOpen(false);
			toast.success(`${entityLabel} eliminato.`);
			router.refresh();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Eliminazione non riuscita.";
			toast.error(message);
		} finally {
			setIsDeleting(false);
		}
	}

	function handleEditOpenChange(open: boolean) {
		if (!open && isSaving) return;
		setIsEditOpen(open);
	}

	function handleDeleteOpenChange(open: boolean) {
		if (!open && isDeleting) return;
		setIsDeleteOpen(open);
	}

	const defaultDeleteConsequence =
		"L'eliminazione è permanente. Se esistono record collegati (vincolo Restrict), l'operazione verrà rifiutata.";

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button
						variant="ghost"
						className="h-7 w-7 p-0"
						disabled={editUnavailabe && deleteUnavailabe}
					>
						<span className="sr-only">Apri menu azioni</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Azioni</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{!editUnavailabe && (
						<DropdownMenuItem onClick={() => setIsEditOpen(true)}>
							Modifica
						</DropdownMenuItem>
					)}
					{!deleteUnavailabe && (
						<DropdownMenuItem onClick={() => setIsDeleteOpen(true)}>
							Elimina
						</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<Sheet open={isEditOpen} onOpenChange={handleEditOpenChange}>
				<SheetContent className="flex flex-col sm:max-w-md overflow-y-auto">
					<SheetHeader className="mb-4">
						<SheetTitle>Modifica {entityLabel}</SheetTitle>
						<SheetDescription>
							Aggiorna i campi consentiti, poi salva. La superficie resta aperta
							se il salvataggio fallisce.
						</SheetDescription>
					</SheetHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onEditSubmit)}
							className="flex flex-1 flex-col gap-6"
						>
							<div className="flex flex-col gap-4">{editFormContent}</div>
							<SheetFooter>
								<Button type="submit" disabled={isSaving}>
									{isSaving ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										"Salva"
									)}
								</Button>
							</SheetFooter>
						</form>
					</Form>
				</SheetContent>
			</Sheet>

			<AlertDialog open={isDeleteOpen} onOpenChange={handleDeleteOpenChange}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Eliminare questo {entityLabel}?</AlertDialogTitle>
						<AlertDialogDescription>
							{deleteConsequence ?? defaultDeleteConsequence}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Annulla</AlertDialogCancel>
						<Button
							variant="destructive"
							disabled={isDeleting}
							onClick={() => {
								void onDeleteSubmit();
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
