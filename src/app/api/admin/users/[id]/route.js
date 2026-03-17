import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  const body = await request.json();
  const data = {};

  if (body.name !== undefined) data.name = body.name;
  if (body.pin !== undefined) {
    const pin = body.pin.toString().replace(/\D/g, "").slice(0, 4);
    if (pin.length === 4) data.pin = pin;
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, name: true, pin: true },
    });

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.adminId,
        action: "update_user",
        details: `Updated user ${updated.email}: ${Object.keys(data).join(", ")}`,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Update user error:", error);
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin || session.user.role !== "master") {
    return NextResponse.json({ error: "Master admin only" }, { status: 403 });
  }

  const { id } = params;
  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.adminActivityLog.create({
      data: {
        adminId: session.user.adminId,
        action: "delete_user",
        details: `Deleted user: ${user.email}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete user error:", error);
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
