"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
						<DialogAction
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

const DialogAction = ({ action }: { action: Action }) => {
	const router = useRouter();

	const [isDialogOpen, setIsDialogOpen] = useState(false);

	const form = useForm({
		resolver: zodResolver(action.formData.formSchema),
		defaultValues: action.formData.defaultValues,
	});

	function onSubmit(values: z.infer<typeof action.formData.formSchema>) {
		action.formData.submitAction(values).then(() => {
			form.reset();
			setIsDialogOpen(false);
			router.refresh();
		});
	}

	useEffect(() => {
		if (!isDialogOpen) {
			form.reset();
		}
	}, [isDialogOpen]);

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
				onOpenChange={setIsDialogOpen}
			>
				<DialogContent>
					<DialogHeader className="mb-5">
						<DialogTitle>{action.title}</DialogTitle>
					</DialogHeader>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(onSubmit)}
							className="space-y-8"
						>
							{action.dialogContent}
							<DialogFooter>
								<Button type="submit">
									<Check />
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>
		</>
	);
};
