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
import { ArrowLeftFromLine, ArrowRightFromLine, Database, LogOut, User, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Nav } from "./_components/nav";
import { ProfileSheet } from "./_components/profile-sheet";

export default function DashboardLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const router = useRouter();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [username, setUsername] = useState("");
	const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
	const [isProfileOpen, setIsProfileOpen] = useState(false);
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
				throw new Error("Generazione dati di prova non riuscita");
			}
			toast.success("Dati di prova generati");
			router.refresh();
		} catch {
			toast.error("Errore nella generazione dei dati di prova");
		} finally {
			setIsGeneratingMock(false);
		}
	}

	return (
		<div className="p-4 min-h-[calc(100vh-56px-56px)] h-[calc(100vh-56px-56px)]">
			<TooltipProvider delayDuration={0}>
				<Card className="flex flex-row h-full">
					<div className="h-full items-stretch border-r">
						<div
							className={cn(
								"flex flex-col transition-[width] duration-200 ease-out h-full",
								isCollapsed ? "w-[50px]" : "w-[220px]"
							)}
						>
							<div
								className={cn(
									"flex min-h-[52px] h-[52px] items-center justify-center overflow-auto",
									!isCollapsed && "px-2"
								)}
							>
								<DropdownMenu>
									<DropdownMenuTrigger
										className={cn(
											"flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:size-4 [&_svg]:shrink-0 p-2 overflow-hidden hover:bg-accent rounded-md transition-colors duration-200 ease-out cursor-pointer px-3",
											isCollapsed &&
												"flex size-9 shrink-0 items-center justify-center p-0 [&>svg]:w-auto [&>span]:hidden"
										)}
									>
										<User className="size-4" />
										<span>{username}</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="w-56">
										<DropdownMenuItem
											onClick={() => setIsProfileOpen(true)}
											className="flex items-center gap-3 cursor-pointer"
										>
											<UserRound className="size-4" />
											Profilo
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleGenerateMockData}
											disabled={isGeneratingMock}
											className="flex items-center gap-3 cursor-pointer text-muted-foreground focus:text-muted-foreground"
										>
											<Database className="size-4" />
											{isGeneratingMock ? "Generazione…" : "Dati di prova"}
										</DropdownMenuItem>
										<DropdownMenuSeparator />
										<DropdownMenuItem
											onClick={() => setIsLogoutDialogOpen(true)}
											className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive"
										>
											<LogOut className="size-4" />
											Esci
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
								<ProfileSheet
									open={isProfileOpen}
									onOpenChange={setIsProfileOpen}
									onUsernameChanged={setUsername}
								/>
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
											<ArrowRightFromLine className="size-4" />
										) : (
											<ArrowLeftFromLine className="size-4" />
										)}
									</Button>
								</div>
							</div>
						</div>
					</div>
					<div className="w-full overflow-x-auto overflow-y-hidden">{children}</div>
				</Card>
			</TooltipProvider>
		</div>
	);
}
