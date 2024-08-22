import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function getSession() {
	return cookies().get("session");
}

export async function updateSession(request: NextRequest) {
	const session = request.cookies.get("session")?.value;
	if (session) {
		const expireDate = new Date(Date.now() + 60 * 60 * 1000);
		const response = NextResponse.next();
		response.cookies.set("session", session, { expires: expireDate });
		return response;
	}
}

