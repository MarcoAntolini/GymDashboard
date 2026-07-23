import { getAccountSafe } from "@/data-access/accounts";
import { getSessionCookieName, verifySessionValue } from "@/lib/session";
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
	if (!account) {
		return NextResponse.json({ message: "Unauthenticated" }, { status: 401 });
	}

	return NextResponse.json(
		{
			username: payload.u,
			role: account.role,
			employeeId: account.employee?.id ?? null,
			approved: account.approved
		},
		{ status: 200 }
	);
}

