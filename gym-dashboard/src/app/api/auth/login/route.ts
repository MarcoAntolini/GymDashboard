import { getAccount } from "@/data-access/accounts";
import bcrypt from "bcryptjs";
import { createSessionValue, getSessionCookieName, getSessionTtlSeconds, signSessionValue } from "@/lib/session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
	try {
		const { username, password } = (await req.json()) as { username?: string; password?: string };
		if (!username || !password) {
			return NextResponse.json({ message: "Missing credentials", success: false }, { status: 400 });
		}
		const account = await getAccount({ username });
		if (!account) {
			return NextResponse.json({ message: "Invalid username or password", success: false }, { status: 401 });
		}
		const ok = await bcrypt.compare(password, account.password);
		if (!ok) {
			return NextResponse.json({ message: "Invalid username or password", success: false }, { status: 401 });
		}
		if (!account.approved) {
			return NextResponse.json({ message: "Account not yet authorized", success: false }, { status: 403 });
		}

		const now = Math.floor(Date.now() / 1000);
		const { payloadB64, payload } = createSessionValue(username, now);
		const value = await signSessionValue(payloadB64);

		const res = NextResponse.json({ message: "Logged in", success: true }, { status: 200 });
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
		return NextResponse.json({ message: "Invalid request", success: false }, { status: 400 });
	}
}
