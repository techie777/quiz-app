import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await prisma.setting.findMany();
  const settings = {};
  rows.forEach((r) => {
    settings[r.key] = r.value === "true" ? true : r.value === "false" ? false : r.value;
  });
  return NextResponse.json(settings);
}

export async function PUT(request) {
  const body = await request.json();
  for (const [key, value] of Object.entries(body)) {
    await prisma.setting.upsert({
      where: { key },
      update: { value: String(value) },
      create: { key, value: String(value) },
    });
  }
  return NextResponse.json({ success: true });
}
