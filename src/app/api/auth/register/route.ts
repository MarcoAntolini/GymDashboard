import { createAccount, getAccount } from "@/data-access/accounts";
import { getEmployee } from "@/data-access/employees";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const saltRounds = 10;

export async function POST(req: NextRequest) {
	const { username, password, employeeId } = (await req.json()) as {
		username?: string;
		password?: string;
		employeeId?: string;
	};
	if (!username || !password || !employeeId) {
		return NextResponse.json({ message: "Campi mancanti", success: false }, { status: 400 });
	}
	const employeeIdN = parseInt(employeeId, 10);
	if (Number.isNaN(employeeIdN)) {
		return NextResponse.json({ message: "ID dipendente non valido", success: false }, { status: 400 });
	}
	const hashedPassword = await bcrypt.hash(password, saltRounds);
	const employeeRegistered = await getAccount({ employeeId: employeeIdN });
	if (employeeRegistered) {
		return NextResponse.json({ message: "Dipendente già registrato", success: false }, { status: 409 });
	}
	const employee = await getEmployee(employeeIdN);
	if (!employee) {
		return NextResponse.json({ message: "Nessun dipendente con questo ID", success: false }, { status: 404 });
	}
	const existingAccount = await getAccount({ username });
	if (existingAccount) {
		return NextResponse.json({ message: "Nome utente già esistente", success: false }, { status: 409 });
	}
	const createdAccount = await createAccount({ username, password: hashedPassword, employeeId: employeeIdN });
	if (!createdAccount) {
		return NextResponse.json({ message: "Registrazione non riuscita, riprova più tardi", success: false }, { status: 500 });
	}
	return NextResponse.json({ message: "Registrazione effettuata. Attendi l'autorizzazione", success: true }, { status: 200 });
}
