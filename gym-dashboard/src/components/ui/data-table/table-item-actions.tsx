"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Form } from "@/components/ui/form";
import { FormSheet, FormSheetFooter } from "@/components/ui/form-sheet";
import { zodResolver } from "@hookform/resolvers/zod";
import { Row } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function ItemActions<TFormSchema extends z.ZodType<any, any>>({
	row,
	formSchema,
	editFormContent,
	editAction,
	deleteAction,
	editUnavailabe,
	deleteUnavailabe,
	editTitle = "Modifica"
}: {
	row: Row<any>;
	formSchema: TFormSchema;
	editFormContent: React.ReactNode;
	editAction: (params: { values: z.infer<TFormSchema> }) => Promise<any>;
	deleteAction: () => Promise<void>;
	editUnavailabe?: boolean;
	deleteUnavailabe?: boolean;
	editTitle?: string;
}) {
	const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);
	const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
	const [isEditSubmitting, setIsEditSubmitting] = useState(false);

	const router = useRouter();

	const form = useForm<z.infer<TFormSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			...row.original
		}
	});

	useEffect(() => {
		if (isEditSheetOpen) {
			form.reset({
				...row.original
			});
		} else {
			setIsEditSubmitting(false);
		}
	}, [isEditSheetOpen, row.original, form]);

	function onEditSubmit(values: z.infer<TFormSchema>) {
		if (isEditSubmitting) return;
		setIsEditSubmitting(true);
		editAction({ values })
			.then(() => {
				setIsEditSheetOpen(false);
				router.refresh();
			})
			.finally(() => {
				setIsEditSubmitting(false);
			});
	}

	function onDeleteSubmit() {
		deleteAction().then(() => {
			setIsDeleteDialogOpen(false);
			router.refresh();
		});
	}

	return (
		<>
			<DropdownMenu modal={false}>
				<DropdownMenuTrigger asChild>
					<Button variant="ghost" className="h-7 w-7 p-0" disabled={editUnavailabe && deleteUnavailabe}>
						<span className="sr-only">Apri menu azioni</span>
						<MoreHorizontal className="h-4 w-4" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuLabel>Azioni</DropdownMenuLabel>
					<DropdownMenuSeparator />
					{!editUnavailabe && (
						<DropdownMenuItem onClick={() => setIsEditSheetOpen(true)}>Modifica</DropdownMenuItem>
					)}
					{!deleteUnavailabe && (
						<DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>Elimina</DropdownMenuItem>
					)}
				</DropdownMenuContent>
			</DropdownMenu>

			<FormSheet
				open={isEditSheetOpen}
				onOpenChange={setIsEditSheetOpen}
				title={editTitle}
				preventDismiss={isEditSubmitting}
			>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onEditSubmit)} className="flex flex-col gap-6">
						{editFormContent}
						<FormSheetFooter>
							<Button type="submit" disabled={isEditSubmitting} aria-busy={isEditSubmitting}>
								Salva
							</Button>
						</FormSheetFooter>
					</form>
				</Form>
			</FormSheet>

			<AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Vuoi eliminare questo elemento?</AlertDialogTitle>
						<AlertDialogDescription>
							L&apos;operazione non può essere annullata. L&apos;elemento verrà rimosso dal database.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Annulla</AlertDialogCancel>
						<AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onDeleteSubmit}>
							Elimina
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
