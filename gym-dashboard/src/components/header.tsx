"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useState } from "react";

export function Header() {
	const [isGenerating, setIsGenerating] = useState(false);

	const handleGenerateMockData = async () => {
		setIsGenerating(true);
		try {
			const response = await fetch("/api/mock-data", { method: "POST" });
			if (!response.ok) {
				throw new Error("Failed to generate mock data");
			}
			alert("Mock data generated successfully");
		} catch (error) {
			console.error("Error generating mock data:", error);
			alert("Error generating mock data");
		} finally {
			setIsGenerating(false);
		}
	};

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
					<Button
						variant="outline"
						size="sm"
						onClick={handleGenerateMockData}
						disabled={isGenerating}
					>
						{isGenerating ? "Generating..." : "Generate Mock Data"}
					</Button>
					<ThemeToggle />
				</div>
			</div>
		</header>
	);
}
