import { ListShellLoading } from "@/components/ui/data-table/list-shell-status";
import { Separator } from "@/components/ui/separator";

/** Fallback shell chrome while the entity list mounts (ticket 39). Prefer in-table loading via ServerDataTable. */
export default function DashboardPlaceholder() {
	return (
		<>
			<div className="flex h-14 shrink-0 items-center gap-2 px-4 py-2" />
			<Separator />
			<div className="flex h-full flex-col items-center justify-center p-4">
				<ListShellLoading />
			</div>
		</>
	);
}
