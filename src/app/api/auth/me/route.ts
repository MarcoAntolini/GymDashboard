import { getAccountSafe } from "@/data-access/accounts";
import { isAppRole } from "@/data/nav-routes";
import {
	createSessionValue,
	getSessionCookieName,
	getSessionTtlSeconds,
	signSessionValue,
	verifySessionValue,
} from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
	const sessionCookie = (await cookies()).get(getSessionCookieName())?.value;
	if (!sessionCookie) {
		return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
	}
	const payload = await verifySessionValue(sessionCookie);
	if (!payload) {
		return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
	}

	const account = await getAccountSafe(payload.u);
	if (!account || !account.approved || !isAppRole(account.role)) {
		const res = NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
		res.cookies.delete(getSessionCookieName());
		return res;
	}

	const body = {
		username: payload.u,
		role: account.role,
		employeeId: account.employee?.id ?? null,
		approved: account.approved,
	};

	if (payload.r === account.role) {
		return NextResponse.json(body, { status: 200 });
	}

	const now = Math.floor(Date.now() / 1000);
	const { payloadB64, payload: refreshed } = createSessionValue(payload.u, account.role, now);
	const value = await signSessionValue(payloadB64);
	const res = NextResponse.json(body, { status: 200 });
	res.cookies.set(getSessionCookieName(), value, {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax",
		path: "/",
		maxAge: getSessionTtlSeconds(),
		expires: new Date(refreshed.exp * 1000),
	});
	return res;
}
