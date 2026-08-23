"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Database, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const HIDDEN_STORAGE_KEY = "gym-dashboard:mock-data-launcher-hidden";

export function MockDataLauncher() {
	const router = useRouter();
	const [available, setAvailable] = useState(false);
	const [hidden, setHidden] = useState<boolean | null>(null);
	const [isConfirmOpen, setIsConfirmOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);

	useEffect(() => {
		setHidden(sessionStorage.getItem(HIDDEN_STORAGE_KEY) === "1");
		let cancelled = false;
		(async () => {
			try {
				const response = await fetch("/api/mock-data");
				if (!cancelled) setAvailable(response.ok);
			} catch {
				if (!cancelled) setAvailable(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	const setHiddenAndPersist = useCallback((next: boolean) => {
		setHidden(next);
		sessionStorage.setItem(HIDDEN_STORAGE_KEY, next ? "1" : "0");
	}, []);

	async function generateMockData() {
		setIsGenerating(true);
		try {
			const response = await fetch("/api/mock-data", { method: "POST" });
			if (!response.ok) {
				throw new Error("Generazione dati di prova non riuscita");
			}
			toast.success("Dati di prova generati");
			router.refresh();
		} catch {
			toast.error("Errore nella generazione dei dati di prova");
		} finally {
			setIsGenerating(false);
		}
	}

	async function requestGenerateMockData() {
		if (isGenerating) return;
		try {
			const response = await fetch("/api/mock-data");
			if (!response.ok) {
				throw new Error("Controllo dati esistenti non riuscito");
			}
			const { hasExistingData } = (await response.json()) as { hasExistingData?: boolean };
			if (hasExistingData) {
				setIsConfirmOpen(true);
				return;
			}
			await generateMockData();
		} catch {
			toast.error("Errore nella generazione dei dati di prova");
		}
	}

	if (!available || hidden === null) return null;

	return (
		<div
			className={cn(
				"pointer-events-none fixed right-0 top-1/2 z-[var(--z-dev-tools)] -translate-y-1/2",
				"motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out"
			)}
		>
			{hidden ? (
				<button
					type="button"
					onClick={() => setHiddenAndPersist(false)}
					className="pointer-events-auto flex h-24 w-8 items-center justify-center rounded-l-md border border-r-0 border-warning/40 bg-background text-[10px] font-medium uppercase tracking-wider text-warning hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
					aria-label="Mostra pulsante dati di prova"
					title="Mostra strumenti di test"
				>
					<span className="rotate-180" style={{ writingMode: "vertical-rl" }}>
						Test
					</span>
				</button>
			) : (
				<div className="pointer-events-auto flex items-stretch overflow-hidden rounded-l-md border border-r-0 border-warning/40 bg-background">
					<div className="flex flex-col items-center justify-center gap-1 border-r border-warning/40 bg-warning/10 px-1.5 py-2">
						<span className="text-[9px] font-semibold uppercase tracking-wider text-warning">
							Test
						</span>
						<button
							type="button"
							onClick={() => setHiddenAndPersist(true)}
							className="flex size-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
							aria-label="Nascondi pulsante dati di prova"
							title="Nascondi"
						>
							<X className="size-3.5" />
						</button>
					</div>
					<Button
						type="button"
						variant="ghost"
						className="h-auto rounded-none px-3 py-2 text-foreground hover:bg-accent gap-1"
						disabled={isGenerating}
						onClick={requestGenerateMockData}
					>
						{isGenerating ? (
							<Loader2 className="size-4 animate-spin" />
						) : (
							<Database className="size-4" />
						)}
						{isGenerating ? "Generazione…" : "Dati di prova"}
					</Button>
				</div>
			)}

			<AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Sostituire i dati esistenti?</AlertDialogTitle>
						<AlertDialogDescription>
							Nel sistema ci sono già dati. Generare i dati di prova cancellerà tutto e lo
							sostituirà con record fittizi.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Annulla</AlertDialogCancel>
						<AlertDialogAction
							onClick={generateMockData}
							className="bg-destructive hover:bg-destructive/90"
						>
							Genera dati di prova
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
