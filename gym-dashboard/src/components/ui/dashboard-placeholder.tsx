"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";

type DashboardPlaceholderProps = {
	/** Loading (default) or failed list fetch. */
	variant?: "loading" | "error";
	error?: Error | null;
	onRetry?: () => void;
	/** Domain noun for actionable copy (Cliente, Ingresso, …). */
	entityLabel?: string;
};

export default function DashboardPlaceholder({
	variant = "loading",
	error,
	onRetry,
	entityLabel
}: DashboardPlaceholderProps) {
	const title = entityLabel
		? `Caricamento ${entityLabel} non riuscito`
		: "Caricamento non riuscito";
	const detail =
		error?.message?.trim() ||
		"Controlla la connessione e riprova. Se il problema continua, avvisa un Amministratore.";

	return (
		<div className="flex h-full flex-col">
			<div className="flex h-14 items-center gap-2 px-4" aria-hidden>
				{variant === "loading" ? <Skeleton className="h-8 w-36" /> : null}
			</div>
			<Separator />
			<div
				className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center"
				role={variant === "error" ? "alert" : "status"}
				aria-live={variant === "error" ? "assertive" : "polite"}
				aria-busy={variant === "loading"}
			>
				{variant === "error" ? (
					<>
						<AlertCircle className="size-8 text-destructive" aria-hidden />
						<div className="mx-auto flex max-w-md flex-col gap-1">
							<p className="text-balance text-sm font-medium text-foreground">{title}</p>
							<p className="text-pretty text-sm text-muted-foreground">{detail}</p>
						</div>
						{onRetry ? (
							<Button type="button" variant="outline" size="sm" onClick={onRetry} className="mt-1">
								<RefreshCw className="size-4" aria-hidden />
								Riprova
							</Button>
						) : null}
					</>
				) : (
					<div className="flex w-full max-w-2xl flex-col gap-3 px-2">
						<div className="flex gap-2">
							<Skeleton className="h-9 w-40" />
							<Skeleton className="h-9 w-28" />
						</div>
						<Skeleton className="h-10 w-full" />
						<div className="flex flex-col gap-2 rounded-md border border-border p-2">
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-full" />
							<Skeleton className="h-8 w-3/4" />
						</div>
						<p className="sr-only">Caricamento in corso</p>
					</div>
				)}
			</div>
		</div>
	);
}
