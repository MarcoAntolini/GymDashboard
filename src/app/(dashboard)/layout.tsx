"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ArrowLeftFromLine, ArrowRightFromLine, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Nav } from "./_components/nav";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [username, setUsername] = useState("");
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
	const [isGeneratingMock, setIsGeneratingMock] = useState(false);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (!me?.username) {
					router.push("/auth");
					return;
				}
				setUsername(me.username);
			} catch {
				if (cancelled) return;
				router.push("/auth");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [router]);

	async function handleLogout() {
		await fetch("/api/auth/logout", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		})
			.then((res) => res.json())
			.then((data) => {
				const { success, message } = data;
				if (success) {
					router.push("/auth");
				} else {
					toast.error(message);
				}
			});
	}

	async function handleGenerateMockData() {
		setIsGeneratingMock(true);
		try {
			const response = await fetch("/api/mock-data", { method: "POST" });
			if (!response.ok) {
				throw new Error("Failed to generate mock data");
			}
			toast.success("Dati di prova generati");
		} catch (error) {
			console.error("Error generating mock data:", error);
			toast.error("Errore nella generazione dei dati di prova");
		} finally {
			setIsGeneratingMock(false);
		}
	}

	return (
		<div className="p-4 min-h-[calc(100vh-56px-56px)] h-[calc(100vh-56px-56px)]">
			<TooltipProvider delayDuration={0}>
				<Card className="flex min-h-0 min-w-0 flex-row h-full">
					<div className="h-full shrink-0 items-stretch border-r">
						<div
							className={cn(
								"flex flex-col transition-all duration-300 ease-in-out h-full",
								isCollapsed ? "w-[50px]" : "w-[220px]"
							)}
						>
							<div
								className={cn(
									"flex h-14 shrink-0 items-center justify-center",
									!isCollapsed && "px-2"
								)}
							>
								<DropdownMenu>
									<DropdownMenuTrigger
										className={cn(
											"flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 p-2 overflow-hidden hover:bg-accent rounded-md transition-colors duration-200 ease-in-out cursor-pointer px-3",
											isCollapsed &&
												"flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>svg]:w-auto [&>span]:hidden"
										)}
									>
										<User className="h-4 w-4" />
										<span>{username}</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem
											onClick={() => router.push("/profile")}
											className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground cursor-pointer"
										>
											Profilo
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleGenerateMockData}
											disabled={isGeneratingMock}
											className="flex items-center gap-3 text-muted-foreground cursor-pointer"
										>
											{isGeneratingMock ? "Generazione…" : "Genera dati di prova"}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setIsLogoutDialogOpen(true)}
											className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground hover:!bg-destructive cursor-pointer"
										>
											Esci
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Uscire dall&apos;account?</AlertDialogTitle>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Annulla</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleLogout}
												className="bg-destructive hover:bg-destructive/90"
											>
												Esci
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
							<Separator />
							<div className="flex flex-col justify-between h-full">
								<Nav isCollapsed={isCollapsed} />
								<div className="flex flex-col">
									<Separator />
									<Button
										className="hover:!rounded-t-none hover:!rounded-br-none"
										variant="ghost"
										aria-label={isCollapsed ? "Espandi menu" : "Comprimi menu"}
										onClick={() => setIsCollapsed(!isCollapsed)}
									>
										{isCollapsed ? (
											<ArrowRightFromLine className="h-4 w-4" />
										) : (
											<ArrowLeftFromLine className="h-4 w-4" />
										)}
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
				</Card>
			</TooltipProvider>
		</div>
	);
}
