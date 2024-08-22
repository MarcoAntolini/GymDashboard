"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";

export type Action = {
	title: string;
	icon?: React.ComponentType<{ className?: string }>;
	dialogContent: React.ReactNode;
	// setData: React.Dispatch<React.SetStateAction<any>>;
};

export default function Dashboard({ actions, table }: { actions: Action[]; table: React.ReactNode }) {
	// const handleAction = async (action: () => Promise<void>) => {
	// 	try {
	// 		await action();
	// 	} catch (err: any) {
	// 		console.error("Action error:", err);
	// 	}
	// };
	return (
		<>
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
			<div className="bg-background/95 p-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-scroll">
				{table}
			</div>
		</>
	);
}

const DialogAction = ({ action }: { action: Action }) => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);

	return (
		<Dialog
			open={isDialogOpen}
			onOpenChange={setIsDialogOpen}
		>
			<Button
				onClick={() => setIsDialogOpen(true)}
				variant="ghost"
			>
				{action.icon && <action.icon className="mr-2 h-4 w-4 text-muted-foreground" />}
				{action.title}
			</Button>
			<DialogContent>{action.dialogContent}</DialogContent>
		</Dialog>
	);
};
