import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.mockCategory.findMany({
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.error("Admin Fetch MockCategories Error:", error);
    return NextResponse.json({ error: "Failed to fetch mock categories" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, name, slug, icon, sortOrder } = data;

    let category;
    if (id) {
      // Update
      category = await prisma.mockCategory.update({
        where: { id },
        data: { name, slug, icon, sortOrder: Number(sortOrder) }
      });
    } else {
      // Create
      category = await prisma.mockCategory.create({
        data: { name, slug, icon, sortOrder: Number(sortOrder) }
      });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Admin Save MockCategory Error:", error);
    return NextResponse.json({ error: "Failed to save category" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.mockCategory.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete MockCategory Error:", error);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}
