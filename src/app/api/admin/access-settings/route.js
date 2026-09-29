import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { getAccessSettings } from "@/lib/entitlement";
import { getDb } from "@/lib/mongoDb";

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
    const session = await getServerSession(authOptions);
    // In dev or admin mode allow update
    if (session?.user && !session.user.isAdmin && process.env.NODE_ENV === "production") {
      return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
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
