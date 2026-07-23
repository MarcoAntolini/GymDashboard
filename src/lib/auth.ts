import { isAppRole, roleAllows, type AppRole } from "@/data/nav-routes";
import { getSessionCookieName, verifySessionValue, type SessionPayload } from "@/lib/session";
import { cookies } from "next/headers";

export class AuthError extends Error {
	readonly status: number;

	constructor(message: string, status: number) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

export async function getOptionalSession(): Promise<SessionPayload | null> {
	const raw = (await cookies()).get(getSessionCookieName())?.value;
	if (!raw) return null;
	const payload = await verifySessionValue(raw);
	if (!payload || !isAppRole(payload.r)) return null;
	return payload;
}

export async function requireSession(): Promise<SessionPayload> {
	const session = await getOptionalSession();
	if (!session) {
		throw new AuthError("Unauthenticated", 401);
	}
	return session;
}

export async function requireRole(minRole: AppRole): Promise<SessionPayload> {
	const session = await requireSession();
	if (!roleAllows(session.r, minRole)) {
		throw new AuthError("Forbidden", 403);
	}
	return session;
}

/**
 * Public register/login helpers: allow unauthenticated callers.
 * If a session cookie is present, enforce `minRole` (blocks Employee from Admin-only helpers).
 */
export async function requireRoleUnlessPublic(minRole: AppRole): Promise<SessionPayload | null> {
	const session = await getOptionalSession();
	if (!session) return null;
	if (!roleAllows(session.r, minRole)) {
		throw new AuthError("Forbidden", 403);
	}
	return session;
}
