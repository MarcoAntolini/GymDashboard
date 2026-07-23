import {
	canAccessPath,
	FORBIDDEN_PATH,
	getLandingPath,
	isAppRole,
} from "@/lib/rbac";
import { createSessionValue, getSessionCookieName, signSessionValue, verifySessionValue } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;
	const isAuthRoute = path.startsWith("/auth");
	const isForbiddenRoute = path === FORBIDDEN_PATH || path.startsWith(`${FORBIDDEN_PATH}/`);

	const raw = request.cookies.get(getSessionCookieName())?.value;
	const payload = raw ? await verifySessionValue(raw) : null;
	const role = payload && isAppRole(payload.r) ? payload.r : null;

	if (!payload || !role) {
		if (isAuthRoute) {
			return NextResponse.next();
		}
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	if (isAuthRoute) {
		return NextResponse.redirect(new URL(getLandingPath(role), request.url));
	}

	if (!isForbiddenRoute && !canAccessPath(role, path)) {
		const dest = new URL(FORBIDDEN_PATH, request.url);
		dest.searchParams.set("from", path);
		return NextResponse.redirect(dest);
	}

	// sliding refresh (demo): extend TTL when close to expiry — preserve role
	const now = Math.floor(Date.now() / 1000);
	if (payload.exp - now < 15 * 60) {
		const { payloadB64, payload: refreshed } = createSessionValue(payload.u, role, now);
		const value = await signSessionValue(payloadB64);
		const res = NextResponse.next();
		res.cookies.set(getSessionCookieName(), value, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			path: "/",
			maxAge: refreshed.exp - now,
			expires: new Date(refreshed.exp * 1000),
		});
		return res;
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|uploads/|.*\\.png$).*)"],
};
