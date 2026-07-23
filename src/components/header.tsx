"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 items-center gap-3 max-w-full">
				<Image
					src={"/logo.png"}
					alt={"Gym Dashboard"}
					width={40}
					height={40}
				/>
				<span className="text-2xl font-bold">Gym Dashboard</span>
				<div className="flex flex-1 items-center justify-end">
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
