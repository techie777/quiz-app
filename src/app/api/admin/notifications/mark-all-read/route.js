import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.setting.upsert({
    where: { key: `adminNotifSeen:${session.user.adminId}` },
    update: { value: new Date().toISOString() },
    create: { key: `adminNotifSeen:${session.user.adminId}`, value: new Date().toISOString() },
  });

  return NextResponse.json({ success: true });
}

