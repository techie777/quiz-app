import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key }
      });
      return NextResponse.json(setting || { key, value: null });
    }

    const rows = await prisma.setting.findMany();
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value === "true" ? true : r.value === "false" ? false : r.value;
    });
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    
    // Fallback settings when database is unavailable
    const fallbackSettings = {
      difficultyEnabled: true,
      showAdvancedFilters: true, // Add missing field
      homeChips: JSON.stringify(["Science", "History", "GK", "Quick 5 Min"]),
      theme: "light",
      soundEnabled: true,
      timerEnabled: false,
      languageEnabled: true,
      navbarEnabled: true, // Add this to ensure navbar is visible
      footerEnabled: true, // Add this to ensure footer is visible
    };
    
    console.log("[API] Returning fallback settings due to database error");
    return NextResponse.json(fallbackSettings);
  }
}

export async function PUT(request) {
  try {
    const adminCheck = await requireAdmin({ masterOnly: false });
    if (!adminCheck.ok) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }
    const admin = adminCheck.admin;

    // Check permissions if not master
    if (admin.role !== "master") {
      const perms = typeof admin.permissions === 'string' ? JSON.parse(admin.permissions) : (admin.permissions || {});
      if (perms.settings === false) {
        return NextResponse.json({ error: "Forbidden - no settings permission" }, { status: 403 });
      }
    }

    const body = await request.json();
    console.log("[Settings PUT] Body:", body);
    
    for (const [key, value] of Object.entries(body)) {
      console.log(`[Settings PUT] Upserting ${key}: ${value}`);
      await prisma.setting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      });
    }
    console.log("[Settings PUT] Success");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Settings PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
