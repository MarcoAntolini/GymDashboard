"use client";

import {
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle
} from "@/components/ui/sheet";
import type { ReactNode } from "react";

/** Shared create/edit surface: right Sheet with scroll + form-friendly width. */
const FORM_SHEET_CONTENT_CLASS =
	"flex w-full flex-col gap-0 overflow-y-auto sm:max-w-lg";

type FormSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	children: ReactNode;
	/** Block overlay / Escape dismiss (e.g. while submitting). */
	preventDismiss?: boolean;
};

/**
 * CRUD create/edit shell used by Dashboard actions and ItemActions.
 * Radix Dialog primitives under Sheet keep focus trap and Esc close.
 */
export function FormSheet({
	open,
	onOpenChange,
	title,
	children,
	preventDismiss = false
}: FormSheetProps) {
	return (
		<Sheet
			open={open}
			onOpenChange={(next) => {
				if (preventDismiss && !next) return;
				onOpenChange(next);
			}}
		>
			<SheetContent
				side="right"
				className={FORM_SHEET_CONTENT_CLASS}
				onInteractOutside={(event) => {
					if (preventDismiss) event.preventDefault();
				}}
				onEscapeKeyDown={(event) => {
					if (preventDismiss) event.preventDefault();
				}}
			>
				<SheetHeader className="mb-5 text-left">
					<SheetTitle>{title}</SheetTitle>
				</SheetHeader>
				{children}
			</SheetContent>
		</Sheet>
	);
}

export { SheetFooter as FormSheetFooter };
