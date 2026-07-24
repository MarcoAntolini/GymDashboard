import { db } from "@/lib/db";
import { getSessionCookieName, verifySessionValue, type SessionRole } from "@/lib/session";
import { cookies } from "next/headers";

export const ADMIN_REQUIRED_MESSAGE = "Operazione riservata agli amministratori";
export const UNAUTHENTICATED_MESSAGE = "Non autenticato";
export const FORBIDDEN_MESSAGE = "Non hai i privilegi per questa operazione";

export type SessionActor = {
	username: string;
	role: SessionRole;
};

async function readSessionCookie(): Promise<string | undefined> {
	return (await cookies()).get(getSessionCookieName())?.value;
}

/**
 * Verifies HMAC session cookie. Role in cookie is trusted for the TTL;
 * mutations that change privileges should re-check DB (see requireAdminActor).
 */
export async function requireSession(): Promise<SessionActor> {
	const sessionCookie = await readSessionCookie();
	if (!sessionCookie) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	const payload = await verifySessionValue(sessionCookie);
	if (!payload) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	return { username: payload.u, role: payload.r };
}

export async function requireRole(role: SessionRole): Promise<SessionActor> {
	const actor = await requireSession();
	if (role === "Admin" && actor.role !== "Admin") {
		throw new Error(ADMIN_REQUIRED_MESSAGE);
	}
	if (role === "Employee" && actor.role !== "Admin" && actor.role !== "Employee") {
		throw new Error(FORBIDDEN_MESSAGE);
	}
	return actor;
}

/**
 * Gate Admin+ with fresh DB check (approved + role). Prefer for privilege fields
 * (Account.role / approved) and anywhere cookie role alone is not enough.
 */
export async function requireAdminActor(): Promise<SessionActor> {
	const actor = await requireSession();
	const account = await db.account.findUnique({
		where: { username: actor.username },
		select: { role: true, approved: true },
	});
	if (!account?.approved || account.role !== "Admin") {
		throw new Error(ADMIN_REQUIRED_MESSAGE);
	}
	return { username: actor.username, role: "Admin" };
}

/** Optional session for public helpers (register) that tighten when logged in. */
export async function getOptionalSession(): Promise<SessionActor | null> {
	const sessionCookie = await readSessionCookie();
	if (!sessionCookie) return null;
	const payload = await verifySessionValue(sessionCookie);
	if (!payload) return null;
	return { username: payload.u, role: payload.r };
}
