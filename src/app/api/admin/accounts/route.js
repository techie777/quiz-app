import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "admin";

  if (type === "user") {
    const users = await prisma.user.findMany({
      select: { id: true, email: true, name: true, pin: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(users);
  }

  const accounts = await prisma.adminAccount.findMany({
    select: { id: true, username: true, displayName: true, role: true, status: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(accounts);
}

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }
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
    data: { username, passwordHash: hash, displayName: displayName || username, role: "jr", status: "active" },
  });

  await prisma.adminActivityLog.create({
    data: { adminId: session.user.adminId, action: "create_admin", details: `Created Jr Admin: ${username}` },
  });

  return NextResponse.json({ id: account.id, username: account.username, role: account.role, status: account.status }, { status: 201 });
}
