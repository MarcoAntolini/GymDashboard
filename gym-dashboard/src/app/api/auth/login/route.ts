import { getAccount } from "@/data-access/accounts";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const saltRounds = 10;

export async function POST(req: NextRequest, res: NextResponse) {
	const { username, password } = await req.json();
	const account = await getAccount({ username });
	if (!account) {
		return Response.json({ message: "Invalid username or password", success: false });
	}
	const result = await bcrypt.compare(password, account?.password);
	if (!result) {
		return Response.json({ message: "Invalid username or password", success: false });
	}
	if (!account.approved) {
		return Response.json({ message: "Account not yet authorized", success: false });
	}
	const expireDate = new Date(Date.now() + 86400000);
	cookies().set("session", username, { expires: expireDate });
	return Response.json({ message: "Logged in", success: true });
}
