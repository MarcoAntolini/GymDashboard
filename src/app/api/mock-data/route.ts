import { mockAllData } from "@/lib/mockAll";
import { NextResponse } from "next/server";

export async function POST() {
	if (process.env.NODE_ENV !== "development") {
		return NextResponse.json({ message: "Not found" }, { status: 404 });
	}
	try {
		await mockAllData();
		return NextResponse.json({ message: "Mock data generated successfully" }, { status: 200 });
	} catch (error) {
		console.error("Error generating mock data:", error);
		return NextResponse.json({ message: "Error generating mock data" }, { status: 500 });
	}
}