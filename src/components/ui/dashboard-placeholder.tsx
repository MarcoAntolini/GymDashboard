import { Separator } from "@/components/ui/separator";
import { BeatLoader } from "react-spinners";

export default function DashboardPlaceholder() {
	return (
		<>
			<div className="h-[52px] flex gap-2 items-center px-4"></div>
			<Separator />
			<div className="flex flex-col justify-center items-center h-full">
				<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
			</div>
		</>
	);
}
