"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { links } from "@/data/links";
import { roleAllows } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Role } from "@prisma/client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function isActivePath(pathname: string, href: string): boolean {
	const normalized = pathname.replace(/\/+$/, "") || "/";
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
			setIsLoading(true);
			try {
				const res = await fetch("/api/auth/me");
				const me = res.ok ? await res.json() : null;
				if (cancelled) return;
				if (!me?.role) {
					router.push("/auth");
					return;
				}
				setUserRole(me.role as Role);
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

	if (isLoading) {
		return (
			<div
				className="flex flex-col gap-2 px-3 py-3"
				role="status"
				aria-busy="true"
				aria-label="Caricamento navigazione"
			>
				{Array.from({ length: 6 }).map((_, index) => (
					<Skeleton
						key={index}
						className={cn("h-8 w-full", isCollapsed && "mx-auto size-8")}
					/>
				))}
				<span className="sr-only">Caricamento navigazione</span>
			</div>
		);
	}

	return (
		<div
			data-collapsed={isCollapsed}
			className="group flex flex-col gap-4 overflow-auto py-2 data-[collapsed=true]:py-2"
		>
			<nav className="flex flex-col gap-1" aria-label="Navigazione principale">
				{links
					.map((section) => ({
						...section,
						group: section.group.filter((link) => {
							if (!userRole) return false;
							return roleAllows(userRole, link.requiredRole);
						}),
					}))
					.filter((section) => section.group.length > 0)
					.map((section, sectionIndex, visibleSections) => (
						<div
							key={section.title}
							className="grid gap-1 px-2 group-[[data-collapsed=true]]:justify-center group-[[data-collapsed=true]]:px-2"
						>
							{isCollapsed ? (
								<h2 className="sr-only">{section.title}</h2>
							) : (
								<p className="px-2 pb-1 text-xs font-medium tracking-wide text-muted-foreground">
									{section.title}
								</p>
							)}
							{section.group.map((link) => {
								const active = isActivePath(pathname, link.href);
								const variant = active ? "default" : "ghost";
								return isCollapsed ? (
									<Tooltip key={link.href} delayDuration={0}>
										<TooltipTrigger asChild>
											<Link
												href={link.href}
												aria-current={active ? "page" : undefined}
												className={cn(
													buttonVariants({ variant, size: "icon" }),
													"size-9"
												)}
											>
												<link.icon
													className={cn("size-4", !active && "text-muted-foreground")}
													aria-hidden
												/>
												<span className="sr-only">{link.title}</span>
											</Link>
										</TooltipTrigger>
										<TooltipContent side="right" className="flex items-center gap-4">
											<span className="text-muted-foreground">{section.title}</span>
											{link.title}
										</TooltipContent>
									</Tooltip>
								) : (
									<Link
										key={link.href}
										href={link.href}
										aria-current={active ? "page" : undefined}
										className={cn(
											buttonVariants({ variant, size: "sm" }),
											"justify-start gap-2"
										)}
									>
										<link.icon
											className={cn("size-4", !active && "text-muted-foreground")}
											aria-hidden
										/>
										{link.title}
									</Link>
								);
							})}
							{sectionIndex !== visibleSections.length - 1 && <Separator className="my-1" />}
						</div>
					))}
			</nav>
		</div>
	);
}
