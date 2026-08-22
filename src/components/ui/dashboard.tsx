"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComponentType, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "./form";
import { TableChromeActionsProvider } from "@/components/ui/data-table/table-chrome-actions-context";

export type Action = {
	title: string;
	icon?: ComponentType<{ className?: string }>;
	dialogContent: React.ReactNode;
	/** Shown under the dialog title (domain context). */
	description?: string;
	onDialogClose?: () => void;
	formData: FormData<any>;
};

export type FormData<TFormSchema extends z.ZodType<any, any>> = {
	formSchema: TFormSchema;
	defaultValues: z.infer<TFormSchema>;
	submitAction: (values: z.infer<TFormSchema>) => Promise<any>;
};

export default function Dashboard({
	actions,
	table,
	extraToolbar,
}: {
	actions: Action[];
	table: React.ReactNode;
	/** Toolbar controls outside create-Dialog actions (e.g. approval queue, create-elsewhere). */
	extraToolbar?: React.ReactNode;
}) {
	return (
		<TableChromeActionsProvider
			actions={
				<>
					{extraToolbar}
					{actions?.map((action, index) => (
						<DialogAction
							key={`${action.title}-${index}`}
							action={action}
						/>
					))}
				</>
			}
		>
			<div className="flex h-full min-h-0 min-w-0 flex-col">
				<div className="min-h-0 min-w-0 flex-1 overflow-hidden">
					<div className="h-full min-h-0 min-w-0 overflow-hidden bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						{table}
					</div>
				</div>
			</div>
		</TableChromeActionsProvider>
	);
}

function mutationErrorMessage(error: unknown, fallback: string) {
	return error instanceof Error && error.message ? error.message : fallback;
}

const DialogAction = ({ action }: { action: Action }) => {
	const router = useRouter();
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		resolver: zodResolver(action.formData.formSchema),
		defaultValues: action.formData.defaultValues,
	});

	async function onSubmit(values: z.infer<typeof action.formData.formSchema>) {
		setIsSubmitting(true);
		try {
			await action.formData.submitAction(values);
			form.reset();
			setIsDialogOpen(false);
			action.onDialogClose?.();
			router.refresh();
		} catch (error) {
			toast.error(mutationErrorMessage(error, "Impossibile completare la creazione."));
		} finally {
			setIsSubmitting(false);
		}
	}

	useEffect(() => {
		if (!isDialogOpen) {
			form.reset();
			setIsSubmitting(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- reset only on close
	}, [isDialogOpen]);

	function handleOpenChange(open: boolean) {
		if (isSubmitting && !open) return;
		setIsDialogOpen(open);
		if (!open) {
			action.onDialogClose?.();
		}
	}

	return (
		<>
			<Button
				onClick={() => setIsDialogOpen(true)}
				variant="ghost"
			>
				{action.icon && <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
				{action.title}
			</Button>
			<Dialog
				open={isDialogOpen}
				onOpenChange={handleOpenChange}
			>
				<DialogContent
					onPointerDownOutside={(e) => {
						if (isSubmitting) e.preventDefault();
					}}
					onEscapeKeyDown={(e) => {
						if (isSubmitting) e.preventDefault();
					}}
				>
					<DialogHeader className="mb-5">
						<DialogTitle>{action.title}</DialogTitle>
						{action.description ? (
							<DialogDescription>{action.description}</DialogDescription>
						) : null}
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-8"
						>
							{action.dialogContent}
							<DialogFooter>
								<Button
									type="submit"
									disabled={isSubmitting}
								>
									{isSubmitting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<Check className="h-4 w-4" />
									)}
									<span className="sr-only">Conferma</span>
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
};
