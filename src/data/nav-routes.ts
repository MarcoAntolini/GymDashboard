/**
 * Edge-safe source of truth: path → minimum role + role hierarchy.
 * Labels follow CONTEXT.md glossary (Italian). `links.ts` adds icons + sections.
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
	{ title: "Panoramica", href: "/", requiredRole: "Employee" },
	{ title: "Account", href: "/accounts", requiredRole: "Admin" },
	{ title: "Dipendenti", href: "/employees", requiredRole: "Admin" },
	{ title: "Contratti", href: "/contracts", requiredRole: "Admin" },
	{ title: "Timbrature", href: "/clockings", requiredRole: "Admin" },
	{ title: "Stipendi", href: "/salaries", requiredRole: "Admin" },
	{ title: "Attrezzatura", href: "/equipment", requiredRole: "Employee" },
	{ title: "Bollette", href: "/bills", requiredRole: "Employee" },
	{ title: "Interventi", href: "/interventions", requiredRole: "Employee" },
	{ title: "Clienti", href: "/clients", requiredRole: "Employee" },
	{ title: "Ingressi", href: "/entrances", requiredRole: "Employee" },
	{ title: "Prodotti", href: "/products", requiredRole: "Employee" },
	{ title: "Abbonamenti", href: "/memberships", requiredRole: "Employee" },
	{ title: "Pacchetti ingressi", href: "/entrance-sets", requiredRole: "Employee" },
	{ title: "Listino annuale", href: "/catalogs", requiredRole: "Employee" },
	{ title: "Pagamenti", href: "/payments", requiredRole: "Employee" },
	{ title: "Vendite", href: "/sales", requiredRole: "Employee" },
];

/** Post-login home: Panoramica operativa (Admin/Owner e Dipendente). */
export const ADMIN_LANDING = "/";
/** Post-login home: stessa Panoramica; Ingressi resta in nav Accessi. */
export const EMPLOYEE_LANDING = "/";

export function landingPathForRole(_role: AppRole): string {
	return "/";
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
	// Exact `/` first — `startsWith("/" + …)` would otherwise match every path if mis-ordered.
	if (normalized === "/") {
		const home = NAV_ROUTES.find((route) => route.href === "/");
		return home?.requiredRole ?? null;
	}
	const match = NAV_ROUTES.find(
		(route) =>
			route.href !== "/" &&
			(route.href === normalized || normalized.startsWith(`${route.href}/`))
	);
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
