import { mockAllData } from "@/lib/mockAll";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    await mockAllData();
    return NextResponse.json({ message: "Mock data generated successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error generating mock data:", error);
    return NextResponse.json({ message: "Error generating mock data" }, { status: 500 });
  }
}