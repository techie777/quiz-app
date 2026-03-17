import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }
  const { id } = params;
  const body = await request.json();
  const data = {};

  if (body.status) data.status = body.status;
  if (body.newPassword) data.passwordHash = await bcrypt.hash(body.newPassword, 10);
  if (body.displayName !== undefined) data.displayName = body.displayName;

  const updated = await prisma.adminAccount.update({ where: { id }, data });

  const actionDetails = [];
  if (body.status) actionDetails.push(`status→${body.status}`);
  if (body.newPassword) actionDetails.push("password reset");
  await prisma.adminActivityLog.create({
    data: {
      adminId: session.user.adminId,
      action: "update_admin",
      details: `Updated ${updated.username}: ${actionDetails.join(", ")}`,
    },
  });

  return NextResponse.json({ id: updated.id, username: updated.username, role: updated.role, status: updated.status });
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

  await prisma.adminActivityLog.create({
    data: { adminId: session.user.adminId, action: "delete_admin", details: `Deleted admin: ${account.username}` },
  });

  return NextResponse.json({ success: true });
}
