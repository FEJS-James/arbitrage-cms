export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { initDb } from "@/lib/db";

export async function POST() {
  try {
    await initDb();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to initialize database:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
