"use client";

import { Button } from "@/components/ui/button";
import { approveAccount, rejectPendingAccount } from "@/data-access/accounts";
import type { AccountListItem } from "@/data-access/accounts";
import { Check, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

function mutationErrorMessage(error: unknown, fallback: string): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message;
	}
	return fallback;
}

export function PendingApprovals({
	pending,
	onApproved,
	onRejected,
}: {
	pending: AccountListItem[];
	onApproved: (account: AccountListItem) => void;
	onRejected: (account: Pick<AccountListItem, "employeeId">) => void;
}) {
	const router = useRouter();
	const [busyEmployeeId, setBusyEmployeeId] = useState<number | null>(null);

	if (pending.length === 0) {
		return null;
	}

	async function handleAccept(account: AccountListItem) {
		if (busyEmployeeId != null) return;
		setBusyEmployeeId(account.employeeId);
		try {
			const updated = await approveAccount({ employeeId: account.employeeId });
			onApproved(updated);
			toast.success(`Approvazione concessa a ${account.username}`);
			router.refresh();
		} catch (error: unknown) {
			toast.error(mutationErrorMessage(error, "Impossibile accettare questo Account."));
		} finally {
			setBusyEmployeeId(null);
		}
	}

	async function handleReject(account: AccountListItem) {
		if (busyEmployeeId != null) return;
		setBusyEmployeeId(account.employeeId);
		try {
			await rejectPendingAccount({ employeeId: account.employeeId });
			onRejected({ employeeId: account.employeeId });
			toast.success(`Account ${account.username} rifiutato ed eliminato`);
			router.refresh();
		} catch (error: unknown) {
			toast.error(mutationErrorMessage(error, "Impossibile rifiutare questo Account."));
		} finally {
			setBusyEmployeeId(null);
		}
	}

	return (
		<section
			aria-labelledby="pending-approvals-heading"
			className="rounded-md border border-amber-500/30 bg-amber-500/5 p-4"
		>
			<div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
				<div>
					<h2 id="pending-approvals-heading" className="text-sm font-semibold tracking-tight">
						In attesa di Approvazione
					</h2>
					<p className="text-sm text-muted-foreground">
						Accetta per abilitare l&apos;accesso, oppure rifiuta eliminando l&apos;Account.
					</p>
				</div>
				<span className="text-xs tabular-nums text-muted-foreground">{pending.length} in coda</span>
			</div>
			<ul className="divide-y rounded-md border bg-background">
				{pending.map((account) => {
					const busy = busyEmployeeId === account.employeeId;
					return (
						<li
							key={account.employeeId}
							className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5"
						>
							<div className="min-w-0">
								<p className="truncate font-medium">{account.username}</p>
								<p className="text-xs text-muted-foreground tabular-nums">
									Dipendente {account.employeeId.toString().padStart(4, "0")} · {account.role}
								</p>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<Button
									type="button"
									size="sm"
									disabled={busyEmployeeId != null}
									aria-busy={busy}
									onClick={() => {
										void handleAccept(account);
									}}
								>
									{busy ? (
										<Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
									) : (
										<Check className="size-4" aria-hidden />
									)}
									Accetta
								</Button>
								<Button
									type="button"
									size="sm"
									variant="destructive"
									disabled={busyEmployeeId != null}
									aria-busy={busy}
									onClick={() => {
										void handleReject(account);
									}}
								>
									{busy ? (
										<Loader2 className="size-4 animate-spin motion-reduce:animate-none" aria-hidden />
									) : (
										<X className="size-4" aria-hidden />
									)}
									Rifiuta
								</Button>
							</div>
						</li>
					);
				})}
			</ul>
		</section>
	);
}
