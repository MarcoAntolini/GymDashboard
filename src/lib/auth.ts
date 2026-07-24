import {
	canManageRole,
	isAppRole,
	roleAllows,
	type AppRole,
} from "@/data/nav-routes";
import { db } from "@/lib/db";
import { getSessionCookieName, verifySessionValue, type SessionRole } from "@/lib/session";
import { cookies } from "next/headers";

export const ADMIN_REQUIRED_MESSAGE = "Operazione riservata agli amministratori";
export const OWNER_REQUIRED_MESSAGE = "Operazione riservata al proprietario";
export const UNAUTHENTICATED_MESSAGE = "Non autenticato";
export const FORBIDDEN_MESSAGE = "Non hai i privilegi per questa operazione";
export const ROLE_HIERARCHY_MESSAGE =
	"Non puoi gestire un Account di grado pari o superiore";
export const OWNER_ASSIGN_MESSAGE =
	"La promozione a Proprietario non è disponibile dall'applicazione";

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
	if (!roleAllows(actor.role, role)) {
		if (role === "Owner") throw new Error(OWNER_REQUIRED_MESSAGE);
		if (role === "Admin") throw new Error(ADMIN_REQUIRED_MESSAGE);
		throw new Error(FORBIDDEN_MESSAGE);
	}
	return actor;
}

async function loadApprovedActor(actor: SessionActor): Promise<SessionActor> {
	const account = await db.account.findUnique({
		where: { username: actor.username },
		select: { role: true, approved: true },
	});
	if (!account?.approved || !isAppRole(account.role)) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	return { username: actor.username, role: account.role };
}

/**
 * Gate Admin+ (Owner | Admin) with fresh DB check. Prefer for privilege fields
 * (Account.role / approved) and anywhere cookie role alone is not enough.
 */
export async function requireAdminActor(): Promise<SessionActor> {
	const actor = await requireSession();
	const fresh = await loadApprovedActor(actor);
	if (!roleAllows(fresh.role, "Admin")) {
		throw new Error(ADMIN_REQUIRED_MESSAGE);
	}
	return fresh;
}

/** Gate Owner-only with fresh DB check (e.g. gestione Admin). */
export async function requireOwnerActor(): Promise<SessionActor> {
	const actor = await requireSession();
	const fresh = await loadApprovedActor(actor);
	if (fresh.role !== "Owner") {
		throw new Error(OWNER_REQUIRED_MESSAGE);
	}
	return fresh;
}

/** Assert actor may manage target role and assign nextRole (never Owner via app). */
export function assertRoleHierarchy(
	actorRole: AppRole,
	targetRole: AppRole,
	nextRole?: AppRole
): void {
	if (!canManageRole(actorRole, targetRole)) {
		throw new Error(ROLE_HIERARCHY_MESSAGE);
	}
	if (nextRole === undefined) return;
	if (nextRole === "Owner") {
		throw new Error(OWNER_ASSIGN_MESSAGE);
	}
	if (!canManageRole(actorRole, nextRole)) {
		throw new Error(ROLE_HIERARCHY_MESSAGE);
	}
}

/** Optional session for public helpers (register) that tighten when logged in. */
export async function getOptionalSession(): Promise<SessionActor | null> {
	const sessionCookie = await readSessionCookie();
	if (!sessionCookie) return null;
	const payload = await verifySessionValue(sessionCookie);
	if (!payload) return null;
	return { username: payload.u, role: payload.r };
}
