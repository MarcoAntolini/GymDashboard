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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { filterApprovableAccounts } from "@/lib/domain/account-role-hierarchy";
import type { AppRole } from "@/data/nav-routes";
import { Account } from "@prisma/client";
import { Check, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type ApprovalQueueSheetProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	actorRole: AppRole;
	pendingAccounts: Account[];
	onApprove: (employeeId: number) => Promise<void>;
	onReject: (employeeId: number) => Promise<void>;
};

export function ApprovalQueueSheet({
	open,
	onOpenChange,
	actorRole,
	pendingAccounts,
	onApprove,
	onReject,
}: ApprovalQueueSheetProps) {
	const [busyId, setBusyId] = useState<number | null>(null);
	const [rejectTarget, setRejectTarget] = useState<Account | null>(null);

	const actionable = useMemo(
		() => filterApprovableAccounts(actorRole, pendingAccounts),
		[actorRole, pendingAccounts]
	);

	const visibleOutOfScope = useMemo(() => {
		const actionableIds = new Set(actionable.map((a) => a.employeeId));
		return pendingAccounts.filter((a) => !actionableIds.has(a.employeeId));
	}, [actionable, pendingAccounts]);

	async function handleApprove(account: Account) {
		setBusyId(account.employeeId);
		try {
			await onApprove(account.employeeId);
			toast.success(`Account ${account.username} approvato`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Approvazione non riuscita.");
		} finally {
			setBusyId(null);
		}
	}

	async function handleRejectConfirm() {
		if (!rejectTarget) return;
		const account = rejectTarget;
		setBusyId(account.employeeId);
		setRejectTarget(null);
		try {
			await onReject(account.employeeId);
			toast.success(`Account ${account.username} rifiutato`);
		} catch (err) {
			toast.error(err instanceof Error ? err.message : "Rifiuto non riuscito.");
		} finally {
			setBusyId(null);
		}
	}

	return (
		<>
			<Sheet open={open} onOpenChange={onOpenChange}>
				<SheetContent side="bottom" className="h-[min(480px,70vh)] overflow-y-auto">
					<SheetHeader className="mb-4">
						<SheetTitle>Coda Approvazione</SheetTitle>
						<SheetDescription>
							Account in attesa di Approvazione. Approva o rifiuta le registrazioni di competenza.
						</SheetDescription>
					</SheetHeader>

					{pendingAccounts.length === 0 ? (
						<p className="text-sm text-muted-foreground py-6 text-center">
							Nessun Account in attesa di Approvazione.
						</p>
					) : (
						<ul className="space-y-2">
							{actionable.map((account) => {
								const busy = busyId === account.employeeId;
								return (
									<li
										key={account.employeeId}
										className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0"
									>
										<div className="min-w-0">
											<p className="font-medium truncate">{account.username}</p>
											<p className="text-sm text-muted-foreground">
												Dipendente #{String(account.employeeId).padStart(4, "0")} · {account.role}
											</p>
										</div>
										<div className="flex gap-2 shrink-0">
											<Button
												type="button"
												size="sm"
												disabled={busy}
												onClick={() => handleApprove(account)}
											>
												<Check className="mr-1 h-4 w-4" />
												Approva
											</Button>
											<Button
												type="button"
												size="sm"
												variant="destructive"
												disabled={busy}
												onClick={() => setRejectTarget(account)}
											>
												<X className="mr-1 h-4 w-4" />
												Rifiuta
											</Button>
										</div>
									</li>
								);
							})}
							{visibleOutOfScope.map((account) => (
								<li
									key={account.employeeId}
									className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 last:border-0 opacity-60"
								>
									<div className="min-w-0">
										<p className="font-medium truncate">{account.username}</p>
										<p className="text-sm text-muted-foreground">
											Dipendente #{String(account.employeeId).padStart(4, "0")} · {account.role}
										</p>
									</div>
									<p className="text-sm text-muted-foreground shrink-0">
										Fuori dalla tua gerarchia
									</p>
								</li>
							))}
						</ul>
					)}
				</SheetContent>
			</Sheet>

			<AlertDialog open={!!rejectTarget} onOpenChange={(next) => !next && setRejectTarget(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Rifiutare la registrazione?</AlertDialogTitle>
						<AlertDialogDescription>
							L&apos;Account {rejectTarget?.username} verrà eliminato. Il Dipendente potrà registrarsi di
							nuovo.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Annulla</AlertDialogCancel>
						<AlertDialogAction
							className="bg-destructive hover:bg-destructive/90"
							onClick={handleRejectConfirm}
						>
							Rifiuta
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
