import { db } from "@/lib/db";
import { getSessionCookieName, verifySessionValue } from "@/lib/session";
import { cookies } from "next/headers";

export const ADMIN_REQUIRED_MESSAGE = "Operazione riservata agli amministratori";
export const UNAUTHENTICATED_MESSAGE = "Non autenticato";

/**
 * Gate Admin+ per campi Admin-only (role, approved). Usato da mutazioni Account.
 * Ticket 13 rafforzerà RBAC su tutta la superficie; qui copre l'allowlist ticket 11.
 */
export async function requireAdminActor(): Promise<{ username: string }> {
	const sessionCookie = (await cookies()).get(getSessionCookieName())?.value;
	if (!sessionCookie) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	const payload = await verifySessionValue(sessionCookie);
	if (!payload) {
		throw new Error(UNAUTHENTICATED_MESSAGE);
	}
	const account = await db.account.findUnique({
		where: { username: payload.u },
		select: { role: true, approved: true },
	});
	if (!account?.approved || account.role !== "Admin") {
		throw new Error(ADMIN_REQUIRED_MESSAGE);
	}
	return { username: payload.u };
}