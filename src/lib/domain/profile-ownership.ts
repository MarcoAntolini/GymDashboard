/**
 * Self-service profile ownership (ticket 17).
 * Credentials and anagrafica updates must target only the session Account.
 */

export const PROFILE_OWNERSHIP_ERROR = "Non puoi modificare le credenziali di un altro Account";

/** True when the requested username matches the authenticated session username. */
export function isOwnAccount(sessionUsername: string, targetUsername: string): boolean {
	return sessionUsername === targetUsername;
}

/**
 * Throws if `targetUsername` is not the session user.
 * Used before any self-service credential mutation.
 */
export function assertOwnAccount(sessionUsername: string, targetUsername: string): void {
	if (!isOwnAccount(sessionUsername, targetUsername)) {
		throw new Error(PROFILE_OWNERSHIP_ERROR);
	}
}

/**
 * Password change self-service: current password must be verified before accepting a new one.
 * Pure rule — hashing/compare live in callers / password.ts.
 */
export function assertPasswordChangeAllowed(opts: {
	currentPasswordProvided: boolean;
	currentPasswordMatches: boolean;
}): void {
	if (!opts.currentPasswordProvided) {
		throw new Error("Password attuale obbligatoria");
	}
	if (!opts.currentPasswordMatches) {
		throw new Error("Password attuale non corretta");
	}
}
