import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings = {};
  rows.forEach((r) => {
    settings[r.key] = r.value === "true" ? true : r.value === "false" ? false : r.value;
  });
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return NextResponse.json({ success: true });
}
