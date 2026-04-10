import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.funFactCategory.findMany({
      orderBy: { sortOrder: "asc" },
      include: {
        _count: {
          select: { facts: true },
        },
      },
    });
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error("Error fetching admin fun fact categories:", error);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, nameHi, slug, image, sortOrder } = body;

    const category = await prisma.funFactCategory.create({
      data: { name, nameHi, slug, image, sortOrder: sortOrder || 0 },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.funFactCategory.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
