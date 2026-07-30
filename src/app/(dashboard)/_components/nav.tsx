"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { links, roleAllows } from "@/data/links";
import { requiredRoleForPath, type AppRole } from "@/data/nav-routes";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BeatLoader } from "react-spinners";

function routeMatches(pathname: string, href: string): boolean {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	if (href === "/") return normalized === "/";
	return normalized === href || normalized.startsWith(`${href}/`);
}

export function Nav({ isCollapsed }: { isCollapsed: boolean }) {
	const router = useRouter();
	const pathname = usePathname();
	const [userRole, setUserRole] = useState<Role>();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (!me?.role) {
					router.push("/auth");
					return;
				}
				const role = me.role as AppRole;
				setUserRole(role as Role);
				const needed = requiredRoleForPath(pathname);
				if (needed && !roleAllows(role, needed)) {
					router.replace(`/forbidden?from=${encodeURIComponent(pathname)}`);
				}
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
	}, [router, pathname]);

	if (isLoading) {
		return (
			<div className="flex min-h-0 flex-1 flex-col items-center justify-center">
				<BeatLoader color="hsla(20.5 90.2% 48.2%)" />
			</div>
		);
	}

	const visibleSections = links
		.map((section) => ({
			section: section.section,
			group: section.group.filter((link) => userRole != null && roleAllows(userRole, link.requiredRole)),
		}))
		.filter((section) => section.group.length > 0);

	return (
		<div
			data-collapsed={isCollapsed}
			className="group flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain py-2 data-[collapsed=true]:py-2"
		>
			<nav aria-label="Navigazione principale">
				{visibleSections.map((section, sectionIndex) => (
					<div
						key={section.section || section.group[0]?.href || sectionIndex}
						role="group"
						aria-label={section.section || undefined}
						className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
					>
						{section.group.map((link) => {
							const isActive = routeMatches(pathname, link.href);
							const variant = isActive ? "default" : "ghost";
							return isCollapsed ? (
								<Tooltip key={link.href} delayDuration={0}>
									<TooltipTrigger asChild>
										<Link
											href={link.href}
											aria-current={isActive ? "page" : undefined}
											className={cn(
												buttonVariants({ variant, size: "icon" }),
												"size-9",
												variant === "default" &&
													"dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-white"
											)}
										>
											<link.icon className="size-4" />
											<span className="sr-only">{link.title}</span>
										</Link>
									</TooltipTrigger>
									<TooltipContent side="right" className="flex items-center gap-4">
										{link.title}
									</TooltipContent>
								</Tooltip>
							) : (
								<Link
									key={link.href}
									href={link.href}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										buttonVariants({ variant, size: "sm" }),
										"justify-start",
										variant === "default" &&
											"dark:bg-muted dark:text-white dark:hover:bg-muted dark:hover:text-white"
									)}
								>
									<link.icon className="mr-2 size-4" />
									{link.title}
								</Link>
							);
						})}
						{sectionIndex !== visibleSections.length - 1 && <Separator className="mb-1" />}
					</div>
				))}
			</nav>
		</div>
	);
}
