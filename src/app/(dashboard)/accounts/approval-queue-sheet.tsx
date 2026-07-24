"use client";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
} from "@/components/ui/sheet";
import {
	approveAccount,
	getPendingAccounts,
	rejectPendingAccount,
} from "@/data-access/accounts";
import { canManageRole, roleAllows, roleLabelIt, type AppRole } from "@/data/nav-routes";
import { Check, Loader2, UserCheck, X } from "lucide-react";
import { useCallback, useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

type PendingAccount = Awaited<ReturnType<typeof getPendingAccounts>>[number];

export function ApprovalQueueToolbarButton({
	actorRole,
	onAccountApproved,
	onAccountRejected,
}: {
	actorRole: AppRole;
	onAccountApproved: (employeeId: number) => void;
	onAccountRejected: (employeeId: number) => void;
}) {
	const allowed = roleAllows(actorRole, "Admin");
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState<PendingAccount[]>([]);
	const [loading, setLoading] = useState(false);
	const [busyId, setBusyId] = useState<number | null>(null);
	const [isPending, startTransition] = useTransition();

	const loadPending = useCallback(async () => {
		if (!allowed) return;
		setLoading(true);
		try {
			const rows = await getPendingAccounts();
			setPending(rows.filter((row) => canManageRole(actorRole, row.role as AppRole)));
		} catch (error) {
			const message =
				error instanceof Error && error.message
					? error.message
					: "Impossibile caricare la coda di approvazione.";
			toast.error(message);
			setPending([]);
		} finally {
			setLoading(false);
		}
	}, [actorRole, allowed]);

	useEffect(() => {
		if (!open || !allowed) return;
		void loadPending();
	}, [open, loadPending, allowed]);

	const handleApprove = (employeeId: number) => {
		setBusyId(employeeId);
		startTransition(async () => {
			try {
				await approveAccount({ employeeId });
				setPending((prev) => prev.filter((row) => row.employeeId !== employeeId));
				onAccountApproved(employeeId);
				toast.success("Account approvato");
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile approvare l'account.";
				toast.error(message);
			} finally {
				setBusyId(null);
			}
		});
	};

	const handleReject = (employeeId: number) => {
		setBusyId(employeeId);
		startTransition(async () => {
			try {
				await rejectPendingAccount({ employeeId });
				setPending((prev) => prev.filter((row) => row.employeeId !== employeeId));
				onAccountRejected(employeeId);
				toast.success("Account rifiutato");
			} catch (error) {
				const message =
					error instanceof Error && error.message
						? error.message
						: "Impossibile rifiutare l'account.";
				toast.error(message);
			} finally {
				setBusyId(null);
			}
		});
	};

	if (!allowed) {
		return null;
	}

	return (
		<>
			<Button
				type="button"
				variant="ghost"
				onClick={() => setOpen(true)}
			>
				<UserCheck className="mr-2 h-4 w-4 text-muted-foreground" />
				Coda approvazione
			</Button>
			<Sheet
				open={open}
				onOpenChange={setOpen}
			>
				<SheetContent
					side="bottom"
					className="h-[min(520px,85vh)]"
				>
					<SheetHeader className="mb-4">
						<SheetTitle>Coda approvazione Account</SheetTitle>
						<SheetDescription>
							Account in attesa di approvazione. Approva per consentire l&apos;accesso, oppure rifiuta
							per eliminare la registrazione.
						</SheetDescription>
					</SheetHeader>
					{loading ? (
						<div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
							<Loader2 className="h-4 w-4 animate-spin" />
							Caricamento…
						</div>
					) : pending.length === 0 ? (
						<div className="py-12 text-center text-sm text-muted-foreground">
							Nessun account in attesa di approvazione.
						</div>
					) : (
						<ul className="max-h-[calc(min(520px,85vh)-8rem)] space-y-2 overflow-y-auto pr-1">
							{pending.map((account) => {
								const busy = busyId === account.employeeId && isPending;
								const employeeLabel = account.employee
									? `${account.employee.name} ${account.employee.surname}`
									: `Dipendente #${account.employeeId}`;
								return (
									<li
										key={account.employeeId}
										className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 py-3 last:border-b-0"
									>
										<div className="min-w-0">
											<p className="truncate font-medium">{account.username}</p>
											<p className="truncate text-sm text-muted-foreground">
												{employeeLabel} · {roleLabelIt(account.role as AppRole)}
											</p>
										</div>
										<div className="flex shrink-0 gap-2">
											<Button
												type="button"
												size="sm"
												disabled={busy}
												onClick={() => handleApprove(account.employeeId)}
											>
												{busy ? (
													<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												) : (
													<Check className="mr-1.5 h-3.5 w-3.5" />
												)}
												Approva
											</Button>
											<Button
												type="button"
												size="sm"
												variant="destructive"
												disabled={busy}
												onClick={() => handleReject(account.employeeId)}
											>
												{busy ? (
													<Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
												) : (
													<X className="mr-1.5 h-3.5 w-3.5" />
												)}
												Rifiuta
											</Button>
										</div>
									</li>
								);
							})}
						</ul>
					)}
				</SheetContent>
			</Sheet>
		</>
	);
}
