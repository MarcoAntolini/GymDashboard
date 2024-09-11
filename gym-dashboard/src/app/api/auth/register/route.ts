import { createAccount, getAccount } from "@/data-access/accounts";
import { getEmployee } from "@/data-access/employees";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const saltRounds = 10;

export async function POST(req: NextRequest, res: NextResponse) {
	const { username, password, employeeId } = await req.json();
	const employeeIdN = parseInt(employeeId);
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	const employeeRegistered = await getAccount({ employeeId: employeeIdN });
	if (employeeRegistered) {
		return Response.json({ message: "Employee already registered", success: false });
	}
	const employee = await getEmployee(employeeIdN);
	if (!employee) {
		return Response.json({ message: "There is no employee with that ID", success: false });
	}
	const existingAccount = await getAccount(username);
	if (existingAccount) {
		return Response.json({ message: "Username already exists", success: false });
	}
	const createdAccount = await createAccount({ username, password: hashedPassword, employeeId: employeeIdN });
	if (!createdAccount) {
		return Response.json({ message: "Failed to register, please try again later", success: false });
	}
	return Response.json({ message: "Successfully registered. Wait for authorization", success: true });
}
