import { getSessionCookieName } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
	const res = NextResponse.json({ message: "Logged out", success: true }, { status: 200 });
	res.cookies.delete(getSessionCookieName());
	return res;
}
