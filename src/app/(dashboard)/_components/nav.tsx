"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { links } from "@/data/links";
import { isAppRole, roleAllows, type AppRole } from "@/data/nav-routes";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BeatLoader } from "react-spinners";

export function Nav({ isCollapsed }: { isCollapsed: boolean }) {
	const router = useRouter();
	const pathname = usePathname();
	const [userRole, setUserRole] = useState<AppRole>();
	const [selectedLink, setSelectedLink] = useState("/" + pathname.split("/").pop());
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setIsLoading(true);
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (!me?.role || !isAppRole(me.role)) {
					router.push("/auth");
					return;
				}
				setUserRole(me.role);
			} catch {
				if (cancelled) return;
				router.push("/auth");
			} finally {
				if (!cancelled) setIsLoading(false);
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [router]);

	useEffect(() => {
		setSelectedLink("/" + pathname.split("/").pop());
	}, [pathname]);

	const visibleGroups = useMemo(() => {
		if (!userRole) return [];
		return links
			.map(({ section, group }) => ({
				section,
				group: group.filter((link) => roleAllows(userRole, link.requiredRole)),
			}))
			.filter(({ group }) => group.length > 0);
	}, [userRole]);

	return isLoading ? (
		<div className="flex flex-col justify-center items-center h-full">
			<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
		</div>
	) : (
		<div
			data-collapsed={isCollapsed}
			className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2 overflow-auto"
		>
			<nav className="flex flex-col gap-3">
				{visibleGroups.map(({ section, group }, groupIndex) => (
					<div
						key={section}
						className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
					>
						{isCollapsed ? (
							<span className="sr-only">{section}</span>
						) : (
							<p className="px-3 pt-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
								{section}
							</p>
						)}
						{group.map((link) => {
							const isActive = link.href === selectedLink;
							const variant = isActive ? "default" : "ghost";
							return isCollapsed ? (
								<Tooltip
									key={link.href}
									delayDuration={0}
								>
									<TooltipTrigger asChild>
										<Link
											href={link.href}
											aria-current={isActive ? "page" : undefined}
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
										<span className="text-muted-foreground">{section}</span>
										{link.title}
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									key={link.href}
									href={link.href}
									aria-current={isActive ? "page" : undefined}
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
						{groupIndex !== visibleGroups.length - 1 && (
							<Separator className="mb-1 mt-2" />
						)}
					</div>
				))}
			</nav>
		</div>
	);
}
