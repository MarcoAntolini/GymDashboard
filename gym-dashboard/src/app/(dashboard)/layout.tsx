"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { TooltipProvider } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { getCookie } from "cookies-next";
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

	useEffect(() => {
		setUsername(getCookie("session") as string);
	}, []);

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

	return (
		<div className="p-4 min-h-[calc(100vh-56px-56px)] h-[calc(100vh-56px-56px)]">
			<TooltipProvider delayDuration={0}>
				<Card className="flex flex-row h-full">
					<div className="h-full items-stretch border-r">
						<div
							className={cn(
								"flex flex-col transition-all duration-300 ease-in-out h-full",
								isCollapsed ? "w-[50px]" : "w-[200px]"
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
											"flex items-center gap-2 [&>span]:line-clamp-1 [&>span]:flex [&>span]:w-full [&>span]:items-center [&>span]:gap-1 [&>span]:truncate [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 p-2 overflow-hidden hover:bg-accent rounded-md transition-colors duration-200 ease-in-out cursor-pointer px-3",
											isCollapsed &&
												"flex h-9 w-9 shrink-0 items-center justify-center p-0 [&>svg]:w-auto [&>span]:hidden"
										)}
									>
										<User className="h-4 w-4" />
										<span>{username}</span>
									</DropdownMenuTrigger>
									<DropdownMenuContent>
										<DropdownMenuItem className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground">
											Settings
										</DropdownMenuItem>
										<DropdownMenuItem
											onClick={handleLogout}
											className="flex items-center gap-3 [&_svg]:h-4 [&_svg]:w-4 [&_svg]:shrink-0 [&_svg]:text-foreground"
										>
											Logout
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<Separator />
							<div className="flex flex-col justify-between h-full">
								<Nav isCollapsed={isCollapsed} />
								<div className="flex flex-col">
									<Separator />
									<Button
										className=""
										variant="ghost"
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
					<div className="w-full overflow-x-auto overflow-y-hidden">{children}</div>
				</Card>
			</TooltipProvider>
		</div>
	);
}
