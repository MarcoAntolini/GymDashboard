"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { ENTITY_ICON } from "@/lib/domain/icons";
import { ArrowLeftFromLine, ArrowRightFromLine, Database, LogOut } from "lucide-react";
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
	const [isMockConfirmOpen, setIsMockConfirmOpen] = useState(false);
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

	async function requestGenerateMockData() {
		if (isGeneratingMock) return;
		try {
			const response = await fetch("/api/mock-data");
			if (!response.ok) {
				throw new Error("Controllo dati esistenti non riuscito");
			}
			const { hasExistingData } = (await response.json()) as { hasExistingData?: boolean };
			if (hasExistingData) {
				setIsMockConfirmOpen(true);
				return;
			}
			await handleGenerateMockData();
		} catch {
			toast.error("Errore nella generazione dei dati di prova");
		}
	}

	return (
		<div className="box-border flex h-full min-h-0 min-w-0 flex-col p-4">
			<TooltipProvider delayDuration={0}>
				<Card className="flex min-h-0 min-w-0 flex-1 flex-row overflow-hidden">
					<div className="flex min-h-0 shrink-0 flex-col items-stretch border-r">
						<div
							className={cn(
								"flex h-full min-h-0 flex-col overflow-hidden transition-[width] duration-200 ease-out",
								isCollapsed ? "w-[50px]" : "w-[220px]"
							)}
						>
							<div
								className={cn(
									"flex h-14 shrink-0 items-center justify-center py-2",
									!isCollapsed && "px-2"
								)}
							>
								<DropdownMenu>
									<DropdownMenuTrigger
										className={cn(
											"flex h-10 items-center gap-2 overflow-hidden rounded-md px-3 transition-colors duration-200 ease-out hover:bg-accent cursor-pointer [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:size-4 [&_svg]:shrink-0",
											isCollapsed &&
												"flex size-10 shrink-0 items-center justify-center p-0 px-0 [&>svg]:w-auto [&>span]:hidden"
										)}
									>
										<ENTITY_ICON.account className="size-4" />
										<span>{username}</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="start" className="w-56">
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => setIsProfileOpen(true)}
												className="flex items-center gap-3 cursor-pointer"
											>
												<ENTITY_ICON.account className="size-4" />
												Profilo
											</DropdownMenuItem>
											<DropdownMenuItem
												onClick={requestGenerateMockData}
												disabled={isGeneratingMock}
												className="flex items-center gap-3 cursor-pointer text-muted-foreground focus:text-muted-foreground"
											>
												<Database className="size-4" />
												{isGeneratingMock ? "Generazione…" : "Dati di prova"}
											</DropdownMenuItem>
										</DropdownMenuGroup>
										<DropdownMenuSeparator />
										<DropdownMenuGroup>
											<DropdownMenuItem
												onClick={() => setIsLogoutDialogOpen(true)}
												className="flex items-center gap-3 cursor-pointer text-destructive focus:text-destructive"
											>
												<LogOut className="size-4" />
												Esci
											</DropdownMenuItem>
										</DropdownMenuGroup>
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
								<AlertDialog open={isMockConfirmOpen} onOpenChange={setIsMockConfirmOpen}>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Sostituire i dati esistenti?</AlertDialogTitle>
											<AlertDialogDescription>
												Nel sistema ci sono già dati. Generare i dati di prova cancellerà tutto
												e lo sostituirà con record fittizi.
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel>Annulla</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleGenerateMockData}
												className="bg-destructive hover:bg-destructive/90"
											>
												Genera dati di prova
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
							<Separator className="shrink-0" />
							<div className="flex min-h-0 flex-1 flex-col overflow-hidden">
								<Nav isCollapsed={isCollapsed} />
								<div className="flex shrink-0 flex-col">
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
					<div className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</div>
				</Card>
			</TooltipProvider>
		</div>
	);
}
