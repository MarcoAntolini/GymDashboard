import { mockAllData } from "@/lib/mockAll";
import { NextResponse } from "next/server";

export async function POST() {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ message: "Non trovato" }, { status: 404 });
	}
	try {
		await mockAllData();
		return NextResponse.json({ message: "Dati di prova generati" }, { status: 200 });
	} catch (error) {
		console.error("Error generating mock data:", error);
		return NextResponse.json({ message: "Errore nella generazione dei dati di prova" }, { status: 500 });
	}
}