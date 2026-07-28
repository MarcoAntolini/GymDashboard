"use client";

import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type TableErrorStateProps = {
	title?: string;
	message?: string;
	onRetry?: () => void;
};

/** Fetch lista fallito: messaggio actionable + Riprova (niente spinner infinito). */
export function TableErrorState({
	title = "Caricamento non riuscito",
	message = "Non è stato possibile caricare i dati. Controlla la connessione e riprova.",
	onRetry,
}: TableErrorStateProps) {
	return (
		<div
			role="alert"
			className="flex flex-col items-center justify-center gap-3 py-2 text-center"
		>
			<AlertCircle
				className="h-5 w-5 text-destructive"
				aria-hidden
			/>
			<div className="flex flex-col gap-1">
				<p className="text-sm font-medium text-foreground">{title}</p>
				<p className="text-sm text-muted-foreground max-w-md">{message}</p>
			</div>
			{onRetry ? (
				<Button
					type="button"
					variant="outline"
					size="sm"
					onClick={onRetry}
				>
					Riprova
				</Button>
			) : null}
		</div>
	);
}
