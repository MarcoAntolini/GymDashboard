"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";

export function Header() {
	return (
		<header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="container flex h-14 max-w-full items-center justify-between gap-3 px-4">
				<div className="flex items-center gap-3">
					<Image src="/logo.png" alt="Gym Dashboard" width={40} height={40} />
					<span className="text-xl font-semibold tracking-tight">Gym Dashboard</span>
				</div>
				<ThemeToggle />
			</div>
		</header>
	);
}
