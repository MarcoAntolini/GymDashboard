"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getAccount } from "@/data-access/accounts";
import { links } from "@/data/links";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import { getCookie } from "cookies-next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

export function Nav({ isCollapsed }: { isCollapsed: boolean }) {
	const router = useRouter();
	let pathname = usePathname();
	const [userRole, setUserRole] = useState<Role>();
	const [selectedLink, setSelectedLink] = useState("/" + pathname.split("/").pop());
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		getRole();
	});

	useEffect(() => {
		setSelectedLink("/" + pathname.split("/").pop());
	}, [pathname]);

	async function getRole() {
		const user = (getCookie("session") as string) || "";
		const account = await getAccount({ username: user });
		if (account) {
			setUserRole(account.role);
		} else {
			router.push("/auth");
		}
		setIsLoading(false);
	}

	return isLoading ? (
		<div className="flex flex-col justify-center items-center h-full">
			<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
		</div>
	) : (
		<div
			data-collapsed={isCollapsed}
			className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 overflow-auto"
		>
			<nav>
				{links.map((l, _) => (
					<div
						key={_}
						className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
					>
						{l.group
							.filter((link) => {
								if (userRole === "Admin") {
									return true;
								} else {
									return link.requiredRole === userRole;
								}
							})
							.map((link, index) => {
								const variant = link.href === selectedLink ? "default" : "ghost";
								return isCollapsed ? (
									<Tooltip
										key={index}
										delayDuration={0}
									>
										<TooltipTrigger asChild>
											<Link
												href={link.href}
												className={cn(
													buttonVariants({ variant: variant, size: "icon" }),
													"h-9 w-9",
													variant === "default" &&
														"dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
												)}
												onClick={() => setSelectedLink(link.href)}
											>
												<link.icon className="h-4 w-4" />
												<span className="sr-only">{link.title}</span>
											</Link>
										</TooltipTrigger>
										<TooltipContent
											side="right"
											className="flex items-center gap-4"
										>
											{link.title}
										</TooltipContent>
									</Tooltip>
								) : (
									<Link
										key={index}
										href={link.href}
										className={cn(
											buttonVariants({ variant: variant, size: "sm" }),
											"justify-start",
											variant === "default" && "dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white"
										)}
										onClick={() => setSelectedLink(link.href)}
									>
										<link.icon className="mr-2 h-4 w-4" />
										{link.title}
									</Link>
								);
							})}
						{_ !== links.length - 1 && (
							<Separator
								key={_}
								className="mb-1"
							/>
						)}
					</div>
				))}
			</nav>
		</div>
	);
}
