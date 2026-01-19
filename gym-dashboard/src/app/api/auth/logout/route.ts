import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {
	if (!(await cookies()).get("session")) {
		return Response.json({ message: "No session to log out", success: false });
	}
	(await cookies()).delete("session");
	return Response.json({ message: "Logged out", success: true });
}
