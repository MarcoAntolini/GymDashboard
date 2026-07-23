/**
 * Edge-safe path → role map. `links.ts` adds icons only.
 * Do not import Node-only or Prisma client modules here (middleware).
 *
 * Hierarchy: Owner > Admin > Employee
 *
 * Nav labels follow CONTEXT.md glossary (Italian domain terms).
 * Sections: Personale → Operazioni → Listino → Movimenti → Uscite.
 */

export type AppRole = "Owner" | "Admin" | "Employee";

export const APP_ROLES: readonly AppRole[] = ["Owner", "Admin", "Employee"] as const;

const ROLE_RANK: Record<AppRole, number> = {
	Employee: 1,
	Admin: 2,
	Owner: 3,
};

export type NavRoute = {
	title: string;
	href: string;
	requiredRole: AppRole;
};

export type NavRouteGroup = {
	/** Visible section label (sr-only when sidebar collapsed). */
	section: string;
	group: NavRoute[];
};

export const NAV_ROUTE_GROUPS: NavRouteGroup[] = [
	{
		section: "Personale",
		group: [
			{ title: "Account", href: "/accounts", requiredRole: "Admin" },
			{ title: "Dipendenti", href: "/employees", requiredRole: "Admin" },
			{ title: "Contratti", href: "/contracts", requiredRole: "Admin" },
			{ title: "Timbrature", href: "/clockings", requiredRole: "Admin" },
		],
	},
	{
		section: "Operazioni",
		group: [
			{ title: "Clienti", href: "/clients", requiredRole: "Employee" },
			{ title: "Ingressi", href: "/entrances", requiredRole: "Employee" },
		],
	},
	{
		section: "Listino",
		group: [
			{ title: "Prodotti", href: "/products", requiredRole: "Employee" },
			{ title: "Abbonamenti", href: "/memberships", requiredRole: "Employee" },
			{ title: "Pacchetti ingressi", href: "/entrance-sets", requiredRole: "Employee" },
			{ title: "Listino annuale", href: "/catalogs", requiredRole: "Employee" },
		],
	},
	{
		section: "Movimenti",
		group: [
			{ title: "Acquisti", href: "/purchases", requiredRole: "Employee" },
			{ title: "Pagamenti", href: "/payments", requiredRole: "Employee" },
		],
	},
	{
		section: "Uscite",
		group: [
			{ title: "Stipendi", href: "/salaries", requiredRole: "Admin" },
			{ title: "Attrezzatura", href: "/equipment", requiredRole: "Employee" },
			{ title: "Bollette", href: "/bills", requiredRole: "Employee" },
			{ title: "Interventi", href: "/interventions", requiredRole: "Employee" },
		],
	},
];

export function roleRank(role: AppRole): number {
	return ROLE_RANK[role];
}

/** Route access: actor must be ≥ required role. */
export function roleAllows(userRole: AppRole, requiredRole: AppRole): boolean {
	return roleRank(userRole) >= roleRank(requiredRole);
}

/**
 * Account management: actor may create/edit/promote/demote/delete only
 * roles strictly below them. Peers and superiors are forbidden.
 */
export function canManageRole(actorRole: AppRole, targetRole: AppRole): boolean {
	return roleRank(actorRole) > roleRank(targetRole);
}

/** Roles the actor may assign via UI/server (never self/peer/superior; never Owner from app). */
export function assignableRoles(actorRole: AppRole): AppRole[] {
	return APP_ROLES.filter((role) => canManageRole(actorRole, role));
}

export function landingPathForRole(role: AppRole): string {
	return role === "Employee" ? "/entrances" : "/accounts";
}

export function isAppRole(value: unknown): value is AppRole {
	return value === "Owner" || value === "Admin" || value === "Employee";
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
