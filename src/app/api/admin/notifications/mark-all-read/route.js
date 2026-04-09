import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  await prisma.setting.upsert({
    where: { key: `adminNotifSeen:${admin.admin.id}` },
    update: { value: new Date().toISOString() },
    create: { key: `adminNotifSeen:${admin.admin.id}`, value: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}

