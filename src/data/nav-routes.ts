/**
 * Edge-safe source of truth: path → minimum role.
 * `links.ts` adds icons only; middleware and role helpers import from here.
 */

export type AppRole = "Admin" | "Employee";

export type NavRoute = {
	title: string;
	href: string;
	requiredRole: AppRole;
};

export const NAV_ROUTES: NavRoute[] = [
	{ title: "Accounts", href: "/accounts", requiredRole: "Admin" },
	{ title: "Employees", href: "/employees", requiredRole: "Admin" },
	{ title: "Contracts", href: "/contracts", requiredRole: "Admin" },
	{ title: "Clockings", href: "/clockings", requiredRole: "Admin" },
	{ title: "Salaries", href: "/salaries", requiredRole: "Admin" },
	{ title: "Equipment", href: "/equipment", requiredRole: "Employee" },
	{ title: "Bills", href: "/bills", requiredRole: "Employee" },
	{ title: "Interventions", href: "/interventions", requiredRole: "Employee" },
	{ title: "Clients", href: "/clients", requiredRole: "Employee" },
	{ title: "Entrances", href: "/entrances", requiredRole: "Employee" },
	{ title: "Products", href: "/products", requiredRole: "Employee" },
	{ title: "Memberships", href: "/memberships", requiredRole: "Employee" },
	{ title: "Entrance Sets", href: "/entrance-sets", requiredRole: "Employee" },
	{ title: "Catalogs", href: "/catalogs", requiredRole: "Employee" },
	{ title: "Payments", href: "/payments", requiredRole: "Employee" },
	{ title: "Purchases", href: "/purchases", requiredRole: "Employee" },
];

/** Admin operational default until Panoramica `/` (later ticket). */
export const ADMIN_LANDING = "/accounts";
/** Highest-frequency desk task for Dipendente. */
export const EMPLOYEE_LANDING = "/entrances";

export function landingPathForRole(role: AppRole): string {
	return role === "Admin" ? ADMIN_LANDING : EMPLOYEE_LANDING;
}

export function roleAllows(userRole: AppRole, requiredRole: AppRole): boolean {
	if (userRole === "Admin") return true;
	return userRole === requiredRole;
}

export function requiredRoleForPath(pathname: string): AppRole | null {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	const match = NAV_ROUTES.find((route) => route.href === normalized || normalized.startsWith(`${route.href}/`));
	return match?.requiredRole ?? null;
}

export function isAppRole(value: unknown): value is AppRole {
	return value === "Admin" || value === "Employee";
}
