"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComponentType, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Form } from "./form";

export type Action = {
	title: string;
	icon?: ComponentType<{ className?: string }>;
	dialogContent: React.ReactNode;
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
	toolbarExtra,
	createHint,
}: {
	actions: Action[];
	table: React.ReactNode;
	toolbarExtra?: React.ReactNode;
	/** Shown when create is not local to this page (e.g. specializzazioni Pagamento). */
	createHint?: string;
}) {
	const showHint = Boolean(createHint) && actions.length === 0;

	return (
		<div className="flex flex-col h-full">
			<div className="min-h-[52px] flex flex-wrap gap-2 items-center px-4 py-2">
				{actions.map((action, index) => (
					<DialogAction
						key={`${action.title}-${index}`}
						action={action}
					/>
				))}
				{toolbarExtra}
				{showHint ? (
					<p className="text-sm text-muted-foreground max-w-3xl">{createHint}</p>
				) : null}
			</div>
			<Separator />
			<div className="flex-1 overflow-hidden">
				<div className="h-full overflow-hidden bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
					{table}
				</div>
			</div>
		</div>
	);
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
			toast.success("Salvato.");
			router.refresh();
		} catch (err: unknown) {
			const message =
				err instanceof Error ? err.message : "Operazione non riuscita.";
			toast.error(message);
		} finally {
			setIsSubmitting(false);
		}
	}

	useEffect(() => {
		if (!isDialogOpen) {
			form.reset();
			setIsSubmitting(false);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps -- reset only when dialog closes
	}, [isDialogOpen]);

	function handleOpenChange(open: boolean) {
		if (!open && isSubmitting) return;
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
				<DialogContent>
					<DialogHeader className="mb-5">
						<DialogTitle>{action.title}</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="flex flex-col gap-8"
						>
							{action.dialogContent}
							<DialogFooter>
								<Button type="submit" disabled={isSubmitting}>
									{isSubmitting ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : (
										<>
											<Check className="mr-2 h-4 w-4" />
											Salva
										</>
									)}
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
};
