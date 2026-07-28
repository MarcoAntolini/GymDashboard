import { Separator } from "@/components/ui/separator";
import { BeatLoader } from "react-spinners";

export default function DashboardPlaceholder() {
	return (
		<>
			<div className="flex h-14 shrink-0 items-center gap-2 px-4 py-2" />
			<Separator />
			<div className="flex flex-col justify-center items-center h-full">
				<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
			</div>
		</>
	);
}
