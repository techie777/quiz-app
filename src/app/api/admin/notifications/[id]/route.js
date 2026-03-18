import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Not supported. Use /api/admin/notifications/mark-all-read." },
    { status: 400 }
  );
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(
    { error: "Not supported. Use /api/admin/notifications/mark-all-read." },
    { status: 400 }
  );
}
