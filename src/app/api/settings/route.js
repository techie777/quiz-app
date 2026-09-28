import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import { DEFAULT_MODULES_CONFIG, parseModulesConfig } from "@/lib/modulesConfig";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get("key");

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key }
      });
      if (key === "modules") {
        const val = setting?.value ? parseModulesConfig(setting.value) : DEFAULT_MODULES_CONFIG;
        return NextResponse.json({ key: "modules", value: val });
      }
      return NextResponse.json(setting || { key, value: null });
    }

    const rows = await prisma.setting.findMany();
    const settings = {};
    rows.forEach((r) => {
      let val = r.value === "true" ? true : r.value === "false" ? false : r.value;
      if (r.key === "modules") {
        val = parseModulesConfig(val);
      }
      settings[r.key] = val;
    });

    if (!settings.modules) {
      settings.modules = DEFAULT_MODULES_CONFIG;
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Settings GET error:", error);
    
    // Fallback settings when database is unavailable
    const fallbackSettings = {
      difficultyEnabled: true,
      showAdvancedFilters: true,
      homeChips: JSON.stringify(["Science", "History", "GK", "Quick 5 Min"]),
      theme: "light",
      soundEnabled: true,
      timerEnabled: false,
      languageEnabled: true,
      navbarEnabled: true,
      footerEnabled: true,
      modules: DEFAULT_MODULES_CONFIG,
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
      const strVal = typeof value === "object" && value !== null ? JSON.stringify(value) : String(value);
      const existing = await prisma.setting.findUnique({ where: { key } });
      if (existing) {
        await prisma.setting.update({
          where: { key },
          data: { value: strVal },
        });
      } else {
        await prisma.setting.create({
          data: { key, value: strVal },
        });
      }
    }
    console.log("[Settings PUT] Success");
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Settings PUT] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
