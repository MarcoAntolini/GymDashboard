/**
 * Edge-safe path → role map. `links.ts` adds icons only.
 * Do not import Node-only or Prisma client modules here (middleware).
 */

export type AppRole = "Admin" | "Employee";

export type NavRoute = {
	title: string;
	href: string;
	requiredRole: AppRole;
};

export const NAV_ROUTE_GROUPS: { group: NavRoute[] }[] = [
	{
		group: [
			{ title: "Accounts", href: "/accounts", requiredRole: "Admin" },
			{ title: "Employees", href: "/employees", requiredRole: "Admin" },
			{ title: "Contracts", href: "/contracts", requiredRole: "Admin" },
			{ title: "Clockings", href: "/clockings", requiredRole: "Admin" },
		],
	},
	{
		group: [
			{ title: "Salaries", href: "/salaries", requiredRole: "Admin" },
			{ title: "Equipment", href: "/equipment", requiredRole: "Employee" },
			{ title: "Bills", href: "/bills", requiredRole: "Employee" },
			{ title: "Interventions", href: "/interventions", requiredRole: "Employee" },
		],
	},
	{
		group: [
			{ title: "Clients", href: "/clients", requiredRole: "Employee" },
			{ title: "Entrances", href: "/entrances", requiredRole: "Employee" },
			{ title: "Products", href: "/products", requiredRole: "Employee" },
		],
	},
	{
		group: [
			{ title: "Memberships", href: "/memberships", requiredRole: "Employee" },
			{ title: "Entrance Sets", href: "/entrance-sets", requiredRole: "Employee" },
			{ title: "Catalogs", href: "/catalogs", requiredRole: "Employee" },
		],
	},
	{
		group: [
			{ title: "Payments", href: "/payments", requiredRole: "Employee" },
			{ title: "Purchases", href: "/purchases", requiredRole: "Employee" },
		],
	},
];

export function roleAllows(userRole: AppRole, requiredRole: AppRole): boolean {
	if (userRole === "Admin") return true;
	return userRole === requiredRole;
}

export function landingPathForRole(role: AppRole): string {
	return role === "Admin" ? "/accounts" : "/entrances";
}

export function isAppRole(value: unknown): value is AppRole {
	return value === "Admin" || value === "Employee";
}

/** Exact match against known dashboard routes; null = no RBAC path rule. */
export function requiredRoleForPath(pathname: string): AppRole | null {
	const path = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	for (const { group } of NAV_ROUTE_GROUPS) {
		for (const route of group) {
			if (route.href === path) return route.requiredRole;
		}
	}
	return null;
}
