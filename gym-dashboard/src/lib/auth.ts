import { cookies } from "next/headers";
import { AppRole, isAppRole, roleAllows } from "@/lib/rbac";
import { getSessionCookieName, verifySessionValue, type SessionPayload } from "@/lib/session";

export class AuthError extends Error {
	status: 401 | 403;

	constructor(message: string, status: 401 | 403) {
		super(message);
		this.name = "AuthError";
		this.status = status;
	}
}

export async function getSession(): Promise<SessionPayload | null> {
	const raw = (await cookies()).get(getSessionCookieName())?.value;
	if (!raw) return null;
	const payload = await verifySessionValue(raw);
	if (!payload || !isAppRole(payload.r)) return null;
	return payload;
}

export async function requireSession(): Promise<SessionPayload> {
	const session = await getSession();
	if (!session) {
		throw new AuthError("Sessione non valida o scaduta. Accedi di nuovo.", 401);
	}
	return session;
}

export async function requireRole(requiredRole: AppRole): Promise<SessionPayload> {
	const session = await requireSession();
	if (!roleAllows(session.r, requiredRole)) {
		throw new AuthError(
			"Non hai i privilegi per questa operazione. Contatta un Amministratore se ti serve accesso.",
			403
		);
	}
	return session;
}
