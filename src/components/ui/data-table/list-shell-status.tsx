"use client";

import { Button } from "@/components/ui/button";
import { LIST_FETCH_ERROR_MESSAGE } from "@/lib/format/table-empty";
import { cn } from "@/lib/utils";
import { AlertCircle, Loader2, RotateCcw } from "lucide-react";

/**
 * Shared list-slot states for the entity shell (ticket 39).
 * Used inside the table area so Dashboard chrome stays mounted.
 */
export function ListShellLoading({
	className,
	label = "Caricamento elenco…",
}: {
	className?: string;
	label?: string;
}) {
	return (
		<div
			role="status"
			aria-live="polite"
			aria-busy="true"
			className={cn(
				"flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground",
				className
			)}
		>
			<Loader2
				className="size-6 text-primary motion-safe:animate-spin"
				aria-hidden
			/>
			<p className="text-sm">{label}</p>
		</div>
	);
}

export function ListShellError({
	message = LIST_FETCH_ERROR_MESSAGE,
	onRetry,
	className,
}: {
	message?: string | null;
	onRetry: () => void;
	className?: string;
}) {
	return (
		<div
			role="alert"
			className={cn(
				"flex min-h-48 flex-col items-center justify-center gap-4 px-4 text-center",
				className
			)}
		>
			<AlertCircle
				className="size-6 text-destructive"
				aria-hidden
			/>
			<div className="flex max-w-md flex-col gap-1">
				<p className="text-sm font-medium text-foreground">
					Caricamento non riuscito
				</p>
				<p className="text-sm text-muted-foreground">
					{message?.trim() || LIST_FETCH_ERROR_MESSAGE}
				</p>
			</div>
			<Button type="button" variant="outline" onClick={onRetry}>
				<RotateCcw className="mr-2 size-4" aria-hidden />
				Riprova
			</Button>
		</div>
	);
}
