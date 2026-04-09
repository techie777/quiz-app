import { NextResponse } from "next/server";
import { getAdminFromRequest } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function GET() {
  const admin = await getAdminFromRequest();
  if (!admin) return NextResponse.json({ authenticated: false }, { status: 200 });
  return NextResponse.json({ authenticated: true, admin });
}

