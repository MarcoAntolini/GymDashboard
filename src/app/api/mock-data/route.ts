import { hasExistingData, mockAllData } from "@/lib/mockAll";
import { NextResponse } from "next/server";

function notFound() {
	return NextResponse.json({ message: "Non trovato" }, { status: 404 });
}

export async function GET() {
	if (process.env.NODE_ENV !== "development") {
		return notFound();
	}
	try {
		return NextResponse.json({ hasExistingData: await hasExistingData() });
	} catch (error) {
		console.error("Error checking existing data:", error);
		return NextResponse.json({ message: "Errore nel controllo dei dati esistenti" }, { status: 500 });
	}
}

export async function POST() {
	if (process.env.NODE_ENV !== "development") {
		return notFound();
	}
	try {
		await mockAllData();
		return NextResponse.json({ message: "Dati di prova generati" }, { status: 200 });
	} catch (error) {
		console.error("Error generating mock data:", error);
		return NextResponse.json({ message: "Errore nella generazione dei dati di prova" }, { status: 500 });
	}
}