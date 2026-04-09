import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function PUT(request, { params }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  return NextResponse.json(
    { error: "Not supported. Use /api/admin/notifications/mark-all-read." },
    { status: 400 }
  );
}

export async function DELETE(request, { params }) {
  const admin = await requireAdmin();
  if (!admin.ok) return NextResponse.json({ error: admin.error }, { status: admin.status });

  return NextResponse.json(
    { error: "Not supported. Use /api/admin/notifications/mark-all-read." },
    { status: 400 }
  );
}
