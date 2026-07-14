import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/adminSessionServer";

export const dynamic = "force-dynamic";

export async function POST(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const { name, slug, description, icon } = await req.json();
    if (!name || !slug) return NextResponse.json({ error: "Missing name or slug" }, { status: 400 });

    const group = await prisma.forumGroup.create({
      data: { name, slug, description, icon }
    });
    return NextResponse.json(group);
  } catch (error) {
    if (error.code === 'P2002') return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create group" }, { status: 500 });
  }
}

export async function PUT(req) {
  const adminCheck = await requireAdmin();
  if (!adminCheck.ok) return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });

  try {
    const { id, isActive } = await req.json();
    const group = await prisma.forumGroup.update({
      where: { id },
      data: { isActive }
    });
    return NextResponse.json(group);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update group" }, { status: 500 });
  }
}
