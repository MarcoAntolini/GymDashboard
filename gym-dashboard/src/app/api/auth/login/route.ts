import { getAccount } from "@/data-access/accounts";
import { getLandingPath, isAppRole } from "@/lib/rbac";
import bcrypt from "bcryptjs";
import { createSessionValue, getSessionCookieName, getSessionTtlSeconds, signSessionValue } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = (await req.json()) as { username?: string; password?: string };
		if (!username || !password) {
			return NextResponse.json({ message: "Inserisci nome utente e password", success: false }, { status: 400 });
		}
		const account = await getAccount({ username });
		if (!account) {
			return NextResponse.json({ message: "Nome utente o password non validi", success: false }, { status: 401 });
		}
		const ok = await bcrypt.compare(password, account.password);
		if (!ok) {
			return NextResponse.json({ message: "Nome utente o password non validi", success: false }, { status: 401 });
		}
		if (!account.approved) {
			return NextResponse.json(
				{ message: "Account non ancora approvato. Contatta un Amministratore.", success: false },
				{ status: 403 }
			);
		}
		if (!isAppRole(account.role)) {
			return NextResponse.json({ message: "Ruolo Account non valido", success: false }, { status: 500 });
		}

		const now = Math.floor(Date.now() / 1000);
		const { payloadB64, payload } = createSessionValue(username, account.role, now);
		const value = await signSessionValue(payloadB64);
		const redirectTo = getLandingPath(account.role);

		const res = NextResponse.json(
			{ message: "Accesso effettuato", success: true, role: account.role, redirectTo },
			{ status: 200 }
		);
		res.cookies.set(getSessionCookieName(), value, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: getSessionTtlSeconds(),
			expires: new Date(payload.exp * 1000),
		});
		return res;
	} catch {
		return NextResponse.json({ message: "Richiesta non valida", success: false }, { status: 400 });
	}
}
