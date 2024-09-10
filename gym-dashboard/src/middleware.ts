import { NextRequest } from "next/server";
import { getSession, updateSession } from "./auth";

const validRoutes = [
	"/accounts",
	"/bills",
	"/catalogs",
	"/clients",
	"/clockings",
	"/contracts",
	"/employees",
	"/entrance-sets",
	"/entrances",
	"/equipment",
	"/interventions",
	"/memberships",
	"/payments",
	"/products",
	"/purchases",
	"/salaries",
];

export async function middleware(request: NextRequest) {
	const session = await getSession();
	if (session && !validRoutes.includes(request.nextUrl.pathname)) {
		await updateSession(request);
		// TODO: redirect to an error page
		return Response.redirect(new URL("/accounts", request.url));
	}
	if (!session && !request.nextUrl.pathname.startsWith("/auth")) {
		return Response.redirect(new URL("/auth", request.url));
	}
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|.*\\.png$).*)"],
};
