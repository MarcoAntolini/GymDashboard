import {
	createSessionValue,
	getSessionCookieName,
	signSessionValue,
	verifySessionValue,
} from "@/lib/session";
import { landingPathForRole, requiredRoleForPath, roleAllows } from "@/data/nav-routes";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
	const path = request.nextUrl.pathname;
	const isAuthRoute = path.startsWith("/auth");
	const isForbiddenRoute = path === "/forbidden" || path.startsWith("/forbidden/");

	const raw = request.cookies.get(getSessionCookieName())?.value;
	const payload = raw ? await verifySessionValue(raw) : null;

	if (!payload && !isAuthRoute) {
		return NextResponse.redirect(new URL("/auth", request.url));
	}

	if (payload && isAuthRoute) {
		return NextResponse.redirect(new URL(landingPathForRole(payload.r), request.url));
	}

	if (payload && !isAuthRoute && !isForbiddenRoute) {
		const needed = requiredRoleForPath(path);
		if (needed && !roleAllows(payload.r, needed)) {
			const dest = new URL("/forbidden", request.url);
			dest.searchParams.set("from", path);
			return NextResponse.redirect(dest);
		}
	}

	// sliding refresh (demo): extend TTL when close to expiry
	if (payload) {
		const now = Math.floor(Date.now() / 1000);
		if (payload.exp - now < 15 * 60) {
			const { payloadB64, payload: refreshed } = createSessionValue(payload.u, payload.r, now);
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
	}

	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
