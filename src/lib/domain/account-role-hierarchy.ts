import { canManageRole, isAppRole, type AppRole } from "@/data/nav-routes";

/**
 * Hierarchy rules for Account role mutations (ticket 14):
 * - actor may only touch targets with a strictly lower role
 * - actor may only assign roles strictly below them (Owner never assignable via app)
 */
export function assertAccountRoleMutation(params: {
	actorRole: AppRole;
	targetCurrentRole: AppRole;
	nextRole: AppRole;
}): void {
	const { actorRole, targetCurrentRole, nextRole } = params;
	if (!canManageRole(actorRole, targetCurrentRole)) {
		throw new Error("Non puoi gestire un Account di pari grado o superiore.");
	}
	if (!canManageRole(actorRole, nextRole)) {
		throw new Error("Non puoi assegnare un ruolo di pari grado o superiore.");
	}
}

export function assertAccountDeleteAllowed(params: {
	actorRole: AppRole;
	targetRole: AppRole;
}): void {
	const { actorRole, targetRole } = params;
	if (!canManageRole(actorRole, targetRole)) {
		throw new Error("Non puoi eliminare un Account di pari grado o superiore.");
	}
}

export function toAppRole(role: unknown): AppRole {
	if (!isAppRole(role)) {
		throw new Error("Ruolo Account non valido.");
	}
	return role;
}
