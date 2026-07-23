"use client";

import { Button } from "@/components/ui/button";
import { FormSheet, FormSheetFooter } from "@/components/ui/form-sheet";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { ComponentType, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form } from "./form";

export type Action = {
	title: string;
	icon?: ComponentType<{ className?: string }>;
	/** Create/edit body rendered inside the shared FormSheet. */
	dialogContent: React.ReactNode;
	onDialogClose?: () => void;
	formData: FormData<any>;
};

export type FormData<TFormSchema extends z.ZodType<any, any>> = {
	formSchema: TFormSchema;
	defaultValues: z.infer<TFormSchema>;
	submitAction: (values: z.infer<TFormSchema>) => Promise<any>;
};

export default function Dashboard({ actions, table }: { actions: Action[]; table: React.ReactNode }) {
	return (
		<div className="flex flex-col h-full">
			<div className="h-[52px] flex gap-2 items-center px-4">
				{actions &&
					actions.map((action, _) => (
						<SheetAction
							key={_}
							action={action}
						/>
					))}
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

const SheetAction = ({ action }: { action: Action }) => {
	const router = useRouter();

	const [isSheetOpen, setIsSheetOpen] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm({
		resolver: zodResolver(action.formData.formSchema),
		defaultValues: action.formData.defaultValues,
	});

	function onSubmit(values: z.infer<typeof action.formData.formSchema>) {
		if (isSubmitting) return;
		setIsSubmitting(true);
		action.formData
			.submitAction(values)
			.then(() => {
				form.reset();
				setIsSheetOpen(false);
				router.refresh();
			})
			.finally(() => {
				setIsSubmitting(false);
			});
	}

	useEffect(() => {
		if (!isSheetOpen) {
			form.reset(action.formData.defaultValues);
			setIsSubmitting(false);
			action.onDialogClose?.();
		}
		// Reset only on close — not when parent re-renders defaultValues.
		// eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
	}, [isSheetOpen]);

	return (
		<>
			<Button
				onClick={() => setIsSheetOpen(true)}
				variant="ghost"
			>
				{action.icon && <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
				{action.title}
			</Button>
			<FormSheet
				open={isSheetOpen}
				onOpenChange={setIsSheetOpen}
				title={action.title}
				preventDismiss={isSubmitting}
			>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-6"
					>
						{action.dialogContent}
						<FormSheetFooter>
							<Button type="submit" disabled={isSubmitting} aria-busy={isSubmitting}>
								<Check className="h-4 w-4" aria-hidden />
								Salva
							</Button>
						</FormSheetFooter>
					</form>
				</Form>
			</FormSheet>
		</>
	);
};
