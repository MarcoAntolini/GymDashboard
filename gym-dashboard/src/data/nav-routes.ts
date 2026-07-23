/** Edge-safe nav route map (no icons). Source of truth for RBAC path → role. */

export type AppRole = "Admin" | "Employee";

export type NavRoute = {
	title: string;
	href: string;
	requiredRole: AppRole;
	section: string;
};

/**
 * Section order is intentional for role-filtered sidebars:
 * Operazioni (Panoramica first) → Listino → Movimenti → Uscite → Personale (Admin).
 * Employee never sees Personale; Panoramica stays the first item for both roles.
 */
export const navRoutes: NavRoute[] = [
	{ section: "Operazioni", title: "Panoramica", href: "/", requiredRole: "Employee" },
	{ section: "Operazioni", title: "Profilo", href: "/profile", requiredRole: "Employee" },
	{ section: "Operazioni", title: "Clienti", href: "/clients", requiredRole: "Employee" },
	{ section: "Operazioni", title: "Ingressi", href: "/entrances", requiredRole: "Employee" },
	{ section: "Operazioni", title: "Prodotti", href: "/products", requiredRole: "Employee" },
	{ section: "Listino", title: "Abbonamenti", href: "/memberships", requiredRole: "Employee" },
	{ section: "Listino", title: "Pacchetti ingressi", href: "/entrance-sets", requiredRole: "Employee" },
	{ section: "Listino", title: "Listino annuale", href: "/catalogs", requiredRole: "Employee" },
	{ section: "Movimenti", title: "Acquisti", href: "/purchases", requiredRole: "Employee" },
	{ section: "Movimenti", title: "Pagamenti", href: "/payments", requiredRole: "Employee" },
	{ section: "Uscite", title: "Stipendi", href: "/salaries", requiredRole: "Admin" },
	{ section: "Uscite", title: "Attrezzatura", href: "/equipment", requiredRole: "Employee" },
	{ section: "Uscite", title: "Bollette", href: "/bills", requiredRole: "Employee" },
	{ section: "Uscite", title: "Interventi", href: "/interventions", requiredRole: "Employee" },
	{ section: "Personale", title: "Account", href: "/accounts", requiredRole: "Admin" },
	{ section: "Personale", title: "Dipendenti", href: "/employees", requiredRole: "Admin" },
	{ section: "Personale", title: "Contratti", href: "/contracts", requiredRole: "Admin" },
	{ section: "Personale", title: "Timbrature", href: "/clockings", requiredRole: "Admin" },
];

/**
 * Post-login default for both roles: Panoramica (cassa + mix prodotti).
 * Admin still reaches Account / Approvazione via Personale nav.
 */
export const ADMIN_LANDING_PATH = "/";

/** Dipendente post-login default: Panoramica operativa. */
export const EMPLOYEE_LANDING_PATH = "/";

/** Authenticated recovery page when a route is not allowed for the role. */
export const FORBIDDEN_PATH = "/forbidden";
