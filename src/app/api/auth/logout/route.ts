import { getSessionCookieName } from "@/lib/session";
import { NextResponse } from "next/server";

export async function POST() {
	const res = NextResponse.json({ message: "Disconnesso", success: true }, { status: 200 });
	res.cookies.delete(getSessionCookieName());
	return res;
}
