/**
 * Edge-safe source of truth: path → minimum role + role hierarchy.
 * `links.ts` adds icons only; middleware and role helpers import from here.
 */

export type AppRole = "Owner" | "Admin" | "Employee";

export type NavRoute = {
	title: string;
	href: string;
	requiredRole: AppRole;
};

const ROLE_RANK: Record<AppRole, number> = {
	Employee: 0,
	Admin: 1,
	Owner: 2,
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

/** Admin/Owner operational default until Panoramica `/` (later ticket). */
export const ADMIN_LANDING = "/accounts";
/** Highest-frequency desk task for Dipendente. */
export const EMPLOYEE_LANDING = "/entrances";

export function landingPathForRole(role: AppRole): string {
	return role === "Employee" ? EMPLOYEE_LANDING : ADMIN_LANDING;
}

/** True if `userRole` meets or exceeds `requiredRole` (Owner > Admin > Employee). */
export function roleAllows(userRole: AppRole, requiredRole: AppRole): boolean {
	return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}

/** Strictly inferior only — peers and superiors are not manageable. */
export function canManageRole(actorRole: AppRole, targetRole: AppRole): boolean {
	return ROLE_RANK[actorRole] > ROLE_RANK[targetRole];
}

/**
 * Roles the actor may assign via app UI/API.
 * Owner is never assignable here (DB-only promotion).
 */
export function assignableRoles(actorRole: AppRole): AppRole[] {
	return (["Admin", "Employee"] as const).filter((role) => canManageRole(actorRole, role));
}

export function requiredRoleForPath(pathname: string): AppRole | null {
	const normalized = pathname.endsWith("/") && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
	const match = NAV_ROUTES.find((route) => route.href === normalized || normalized.startsWith(`${route.href}/`));
	return match?.requiredRole ?? null;
}

export function isAppRole(value: unknown): value is AppRole {
	return value === "Owner" || value === "Admin" || value === "Employee";
}

export function roleLabelIt(role: AppRole): string {
	if (role === "Owner") return "Proprietario";
	if (role === "Admin") return "Amministratore";
	return "Dipendente";
}
