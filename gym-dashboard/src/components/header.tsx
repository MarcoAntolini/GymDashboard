import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center gap-3 max-w-full">
				<Image
					src={"/logo.png"}
					alt={"logo"}
					width={40}
					height={40}
				/>
				<span className="text-2xl font-bold">Gym Dashboard</span>
				<div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
					<nav className="flex items-center">
						<ThemeToggle />
					</nav>
				</div>
			</div>
		</header>
	);
}
