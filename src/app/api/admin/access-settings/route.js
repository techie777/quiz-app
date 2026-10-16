import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { getAccessSettings } from "@/lib/entitlement";
import { getDb } from "@/lib/mongoDb";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const settings = await getAccessSettings();
    return NextResponse.json({ success: true, settings });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: true });
    if (!adminCheck.ok) {
      return NextResponse.json({ success: false, error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await request.json();
    const { freeSetsPerWindow, windowMode, limitScope, maxAdMomentsPerSet } = body;

    const updateFields = {};
    if (typeof freeSetsPerWindow === "number") updateFields.freeSetsPerWindow = Math.max(1, freeSetsPerWindow);
    if (windowMode && ["rolling24h", "midnightIST"].includes(windowMode)) updateFields.windowMode = windowMode;
    if (limitScope && ["global", "perTier"].includes(limitScope)) updateFields.limitScope = limitScope;
    if (typeof maxAdMomentsPerSet === "number") updateFields.maxAdMomentsPerSet = maxAdMomentsPerSet;
    updateFields.updatedAt = new Date();

    const db = await getDb();
    await db.collection("access_settings").updateOne(
      { key: "default" },
      { $set: updateFields },
      { upsert: true }
    );

    const updated = await getAccessSettings();
    return NextResponse.json({ success: true, settings: updated });
  } catch (err) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
