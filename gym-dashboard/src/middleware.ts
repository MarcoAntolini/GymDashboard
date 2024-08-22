import { NextRequest } from "next/server";
import { getSession, updateSession } from "./auth";

export async function middleware(request: NextRequest) {
	const session = await getSession();
	// if (session && request.nextUrl.pathname.startsWith("/")) {
	// 	await updateSession(request);
	// 	return Response.redirect(new URL("/", request.url));
	// }
	// if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
	// 	return Response.redirect(new URL("/", request.url)); // TODO redirect to auth
	// }
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
