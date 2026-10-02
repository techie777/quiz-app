// src/app/api/gk/counts/route.js
import { NextResponse } from "next/server";
import { getRealCounts } from "@/lib/counts";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || null;
    const language = searchParams.get("language") || null;

    const counts = await getRealCounts({ category, language });
    return NextResponse.json(counts);
  } catch (err) {
    console.error("Counts API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
