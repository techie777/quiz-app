import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const links = await prisma.navigationLink.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' }
    });
    return NextResponse.json(links);
  } catch (error) {
    console.error("Navigation Fetch Error:", error);
    return NextResponse.json({ error: "Failed to fetch navigation" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, name, href, icon, description, keywords, sortOrder, isVisible } = data;

    let link;
    if (id) {
      link = await prisma.navigationLink.update({
        where: { id },
        data: { name, href, icon, description, keywords, sortOrder: Number(sortOrder), isVisible }
      });
    } else {
      link = await prisma.navigationLink.create({
        data: { name, href, icon, description, keywords, sortOrder: Number(sortOrder), isVisible }
      });
    }
    return NextResponse.json(link);
  } catch (error) {
    console.error("Navigation Save Error:", error);
    return NextResponse.json({ error: "Failed to save navigation" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { items } = await request.json(); // Array of {id, sortOrder}
    
    // Bulk update sort orders
    const updates = items.map(item => 
      prisma.navigationLink.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder }
      })
    );
    
    await Promise.all(updates);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Navigation Reorder Error:", error);
    return NextResponse.json({ error: "Failed to reorder navigation" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.navigationLink.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Navigation Delete Error:", error);
    return NextResponse.json({ error: "Failed to delete navigation" }, { status: 500 });
  }
}
