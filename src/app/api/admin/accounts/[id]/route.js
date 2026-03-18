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
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }
  const { id } = params;
  const body = await request.json();
  const data = {};

  const target = await prisma.adminAccount.findUnique({
    where: { id },
    select: { id: true, username: true, role: true, status: true, passwordHash: true },
  });
  if (!target) {
    return NextResponse.json({ error: "Admin account not found" }, { status: 404 });
  }

  const isUpdatingMasterCreds =
    target.role === "master" && (body.username !== undefined || body.newPassword);
  if (isUpdatingMasterCreds) {
    const currentPassword = String(body.currentPassword || "");
    if (!currentPassword) {
      return NextResponse.json({ error: "Current password required" }, { status: 400 });
    }
    const ok = await bcrypt.compare(currentPassword, target.passwordHash);
    if (!ok) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }
  }

  if (body.status) {
    const nextStatus = String(body.status);
    if (target.role === "master" && nextStatus !== "active") {
      return NextResponse.json({ error: "Cannot disable/pause master admin" }, { status: 400 });
    }
    data.status = nextStatus;
  }

  if (body.username !== undefined) {
    const nextUsername = String(body.username || "").trim();
    if (!nextUsername) {
      return NextResponse.json({ error: "Username cannot be empty" }, { status: 400 });
    }
    if (/\s/.test(nextUsername)) {
      return NextResponse.json({ error: "Username cannot contain spaces" }, { status: 400 });
    }
    const existing = await prisma.adminAccount.findUnique({ where: { username: nextUsername } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "Username already exists" }, { status: 400 });
    }
    data.username = nextUsername;
  }

  if (body.newPassword) {
    const pw = String(body.newPassword || "");
    if (pw.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    data.passwordHash = await bcrypt.hash(pw, 10);
  }
  if (body.displayName !== undefined) data.displayName = body.displayName;

  const updated = await prisma.adminAccount.update({ where: { id }, data });

  const actionDetails = [];
  if (body.status) actionDetails.push(`status→${body.status}`);
  if (body.username !== undefined) actionDetails.push("username updated");
  if (body.newPassword) actionDetails.push("password reset");
  if (body.permissions !== undefined) actionDetails.push("permissions updated");

  if (body.permissions !== undefined) {
    await prisma.setting.upsert({
      where: { key: `adminPerms:${id}` },
      update: { value: String(body.permissions) },
      create: { key: `adminPerms:${id}`, value: String(body.permissions) },
    });
  }

  const permRow = await prisma.setting.findUnique({
    where: { key: `adminPerms:${id}` },
    select: { value: true },
  });
  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "update_admin",
      details: `Updated ${updated.username}: ${actionDetails.join(", ")}`,
    },
  });

  return NextResponse.json({
    id: updated.id,
    username: updated.username,
    role: updated.role,
    status: updated.status,
    permissions: permRow?.value || "{}",
  });
}



export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }
  const { id } = params;
  const account = await prisma.adminAccount.findUnique({ where: { id } });
  if (account?.role === "master") {
    return NextResponse.json({ error: "Cannot delete master admin" }, { status: 400 });
  }
  await prisma.adminAccount.delete({ where: { id } });
  await prisma.setting.deleteMany({ where: { key: `adminPerms:${id}` } });

  await prisma.adminActivityLog.create({
    data: { adminId: session.user.adminId, action: "delete_admin", details: `Deleted admin: ${account.username}` },
  });

  return NextResponse.json({ success: true });
}
