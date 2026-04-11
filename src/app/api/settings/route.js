import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { adminAuthOptions } from "@/lib/adminAuth";
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
    // Try to get admin session first
    let session = await getServerSession(adminAuthOptions);
    console.log("[Settings PUT] Admin session attempt:", session?.user?.email);
    
    // If admin session fails, try regular session (for testing/fallback)
    if (!session?.user?.isAdmin) {
      console.log("[Settings PUT] Admin session failed, trying regular session...");
      const { authOptions } = await import("@/lib/auth");
      session = await getServerSession(authOptions);
      console.log("[Settings PUT] Regular session:", session?.user?.email);
      
      // For testing purposes, allow regular users to update settings
      // In production, this should be removed
      if (session?.user && process.env.NODE_ENV === "development") {
        console.log("[Settings PUT] Development mode - allowing regular user");
        session.user.isAdmin = true; // Override for testing
      }
    }
    
    console.log("[Settings PUT] Final session user:", session?.user?.email, "isAdmin:", session?.user?.isAdmin);
    
    if (!session || !session.user) {
      console.log("[Settings PUT] No session found");
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }
    
    if (!session.user.isAdmin) {
      console.log("[Settings PUT] Unauthorized - not admin");
      return NextResponse.json({ error: "Unauthorized - admin access required" }, { status: 401 });
    }

    const perms = (function () {
      const raw = session.user.permissions;
      if (raw && typeof raw === "object") return raw;
      if (typeof raw !== "string" || !raw.trim()) return {};
      try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === "object" ? parsed : {};
      } catch {
        return {};
      }
    })();

    if (session.user.role !== "master" && perms.settings === false) {
      console.log("[Settings PUT] Forbidden - no settings permission");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
