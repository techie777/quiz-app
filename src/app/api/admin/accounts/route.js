import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "admin";

  if (type === "user") {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, pin: true, createdAt: true, isPro: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  }

  const accounts = await prisma.adminAccount.findMany({
    select: { id: true, username: true, displayName: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  const permKeys = accounts.map((a) => `adminPerms:${a.id}`);
  const perms = await prisma.setting.findMany({
    where: { key: { in: permKeys } },
    select: { key: true, value: true },
  });
  const permMap = new Map(perms.map((p) => [p.key, p.value]));
  return NextResponse.json(
    accounts.map((a) => ({
      ...a,
      permissions: permMap.get(`adminPerms:${a.id}`) || "{}",
    }))
  );
}

export async function POST(request) {
  const admin = await requireAdmin({ masterOnly: true });
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });
  const { username, password, displayName } = await request.json();
  if (!username || !password) {
    return NextResponse.json({ error: "Username and password required" }, { status: 400 });
  }
  const existing = await prisma.adminAccount.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ error: "Username already exists" }, { status: 400 });
  }
  const hash = await bcrypt.hash(password, 10);
  const account = await prisma.adminAccount.create({
    data: {
      username,
      passwordHash: hash,
      displayName: displayName || username,
      role: "jr",
      status: "active",
    },
  });

  await prisma.setting.upsert({
    where: { key: `adminPerms:${account.id}` },
    update: {
      value: JSON.stringify({
        dashboard: true,
        categories: true,
        questions: true,
        daily: true,
        currentAffairs: true,
        upload: true,
        settings: true,
        notifications: true,
        sawalJawab: true,
      }),
    },
    create: {
      key: `adminPerms:${account.id}`,
      value: JSON.stringify({
        dashboard: true,
        categories: true,
        questions: true,
        daily: true,
        currentAffairs: true,
        upload: true,
        settings: true,
        notifications: true,
        sawalJawab: true,
      }),
    },
  });

  await prisma.adminActivityLog.create({
    data: { adminId: admin.admin.id, action: "create_admin", details: `Created Jr Admin: ${username}` },
  });

  return NextResponse.json(
    {
      id: account.id,
      username: account.username,
      role: account.role,
      status: account.status,
      permissions:
        JSON.stringify({
          dashboard: true,
          categories: true,
          questions: true,
          daily: true,
          currentAffairs: true,
          upload: true,
          settings: true,
          notifications: true,
          sawalJawab: true,
        }),
    },
    { status: 201 }
  );
}
