"use client";

import { Button } from "@/components/ui/button";
import type { AppRole } from "@/data/nav-routes";
import { filterApprovableAccounts } from "@/lib/domain/account-role-hierarchy";
import { Account } from "@prisma/client";
import { Check } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type BulkApproveAccountsButtonProps = {
	actorRole: AppRole;
	selectedRows: Account[];
	onApprove: (employeeId: number) => Promise<void>;
	onDone: () => void | Promise<void>;
};

/**
 * Bulk Approva for selected pending Accounts the actor may manage (ticket 42).
 */
export function BulkApproveAccountsButton({
	actorRole,
	selectedRows,
	onApprove,
	onDone,
}: BulkApproveAccountsButtonProps) {
	const [busy, setBusy] = useState(false);

	const approvable = useMemo(() => {
		const pending = selectedRows.filter((a) => !a.approved);
		return filterApprovableAccounts(actorRole, pending);
	}, [actorRole, selectedRows]);

	if (approvable.length === 0) return null;

	async function handleClick() {
		setBusy(true);
		let ok = 0;
		try {
			for (const account of approvable) {
				try {
					await onApprove(account.employeeId);
					ok += 1;
				} catch (err) {
					toast.error(
						err instanceof Error ? err.message : "Approvazione non riuscita."
					);
				}
			}
			if (ok > 0) {
				toast.success(
					ok === 1
						? "Account approvato."
						: `${ok} Account approvati.`
				);
				await onDone();
			}
		} finally {
			setBusy(false);
		}
	}

	return (
		<Button
			type="button"
			variant="secondary"
			size="sm"
			disabled={busy}
			onClick={() => {
				void handleClick();
			}}
		>
			<Check className="h-4 w-4" />
			Approva ({approvable.length})
		</Button>
	);
}
