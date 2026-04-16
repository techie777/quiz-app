import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("categoryId");
    const where = categoryId ? { categoryId } : {};
    const facts = await prisma.funFact.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json({ facts });
  } catch (error) {
    console.error("Error fetching admin facts:", error);
    return NextResponse.json({ error: "Failed to fetch facts" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { categoryId, description, descriptionHi, image, hidden, isDaily } = body;

    if (!categoryId || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (isDaily) {
      await prisma.funFact.updateMany({ data: { isDaily: false } });
    }

    const fact = await prisma.funFact.create({
      data: { 
        categoryId, description, descriptionHi, image, 
        hidden: hidden || false, isDaily: isDaily || false,
        dailyDate: isDaily ? new Date() : null
      },
      include: { category: true }
    });
    
    return NextResponse.json({ fact }, { status: 201 });
  } catch (error) {
    console.error("Error creating fun fact:", error);
    return NextResponse.json({ error: "Failed to create fact" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json();
    const { id, categoryId, description, descriptionHi, image, hidden, isDaily } = body;

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (isDaily) {
      await prisma.funFact.updateMany({ where: { id: { not: id } }, data: { isDaily: false } });
    }

    const fact = await prisma.funFact.update({
      where: { id },
      data: { 
        categoryId, description, descriptionHi, image, hidden,
        isDaily: isDaily !== undefined ? isDaily : undefined,
        dailyDate: isDaily ? new Date() : undefined
      }
    });

    return NextResponse.json({ fact });
  } catch (error) {
    console.error("Error updating fact:", error);
    return NextResponse.json({ error: "Failed to update fact" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const ids = searchParams.get("ids");

    if (ids) {
      const idList = ids.split(",");
      await prisma.funFact.deleteMany({
        where: { id: { in: idList } }
      });
      return NextResponse.json({ message: "Bulk delete successful" });
    }
    
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    await prisma.funFact.delete({ where: { id } });
    return NextResponse.json({ message: "Deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting fact:", error);
    return NextResponse.json({ error: "Failed to delete fact" }, { status: 500 });
  }
}
