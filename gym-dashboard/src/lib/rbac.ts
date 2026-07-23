import {
	ADMIN_LANDING_PATH,
	AppRole,
	EMPLOYEE_LANDING_PATH,
	FORBIDDEN_PATH,
	navRoutes,
} from "@/data/nav-routes";

export type { AppRole };
export { ADMIN_LANDING_PATH, EMPLOYEE_LANDING_PATH, FORBIDDEN_PATH };

/** Admin satisfies every required role; Employee only Employee-scoped routes. */
export function roleAllows(userRole: AppRole, requiredRole: AppRole): boolean {
	if (userRole === "Admin") return true;
	return userRole === requiredRole;
}

export function isAppRole(value: unknown): value is AppRole {
	return value === "Admin" || value === "Employee";
}

export function getLandingPath(role: AppRole): string {
	return role === "Admin" ? ADMIN_LANDING_PATH : EMPLOYEE_LANDING_PATH;
}

/** Resolve required role for a pathname using nav-routes as source of truth. */
export function getRequiredRoleForPath(pathname: string): AppRole | null {
	const normalized = pathname.replace(/\/+$/, "") || "/";
	// Exact first so "/" (Panoramica) never prefix-matches every path.
	const exact = navRoutes.find((route) => route.href === normalized);
	if (exact) return exact.requiredRole;
	const nested = navRoutes.find(
		(route) => route.href !== "/" && normalized.startsWith(`${route.href}/`)
	);
	return nested?.requiredRole ?? null;
}

export function canAccessPath(userRole: AppRole, pathname: string): boolean {
	const required = getRequiredRoleForPath(pathname);
	if (!required) return true;
	return roleAllows(userRole, required);
}
