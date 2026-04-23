import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminSessionServer";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET - Fetch categories and items
export async function GET(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type"); // 'categories' or 'items'
    const categoryId = searchParams.get("categoryId");

    if (type === "categories") {
      const categories = await prisma.sawalJawabCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: {
            select: { items: true }
          }
        }
      });
      return NextResponse.json({ categories }, { status: 200 });
    }

    if (type === "items") {
      const whereClause = categoryId ? { categoryId } : {};
      const items = await prisma.sawalJawab.findMany({
        where: whereClause,
        include: { category: true },
        orderBy: { createdAt: "desc" }
      });
      return NextResponse.json({ items }, { status: 200 });
    }

    // Default: both
    const [categories, items] = await Promise.all([
      prisma.sawalJawabCategory.findMany({
        orderBy: { sortOrder: "asc" },
        include: {
          _count: { select: { items: true } }
        }
      }),
      prisma.sawalJawab.findMany({
        include: { category: true },
        orderBy: { createdAt: "desc" }
      })
    ]);

    return NextResponse.json({ categories, items }, { status: 200 });
  } catch (error) {
    console.error("Admin SawalJawab GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create categories or items
export async function POST(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { type, ...data } = body;

    if (type === "category") {
      const { name, nameHi, slug, image, sortOrder } = data;
      
      const category = await prisma.sawalJawabCategory.upsert({
        where: { name },
        update: {
          nameHi,
          slug: slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          image,
          sortOrder: sortOrder || 0
        },
        create: {
          name,
          nameHi,
          slug: slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          image,
          sortOrder: sortOrder || 0
        }
      });

      return NextResponse.json({ category }, { status: 201 });
    }

    if (type === "item") {
      const { categoryId, question, questionHi, answer, answerHi, image } = data;
      
      const item = await prisma.sawalJawab.create({
        data: {
          categoryId,
          question,
          questionHi,
          answer,
          answerHi,
          image
        },
        include: { category: true }
      });

      return NextResponse.json({ item }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin SawalJawab POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT - Update categories or items
export async function PUT(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const body = await request.json();
    const { type, id, ...data } = body;

    if (type === "category") {
      const category = await prisma.sawalJawabCategory.update({
        where: { id },
        data
      });
      return NextResponse.json({ category }, { status: 200 });
    }

    if (type === "item") {
      const item = await prisma.sawalJawab.update({
        where: { id },
        data,
        include: { category: true }
      });
      return NextResponse.json({ item }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin SawalJawab PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete categories or items
export async function DELETE(request) {
  try {
    const admin = await requireAdmin();
    if (!admin.ok) {
      return NextResponse.json({ error: admin.error }, { status: admin.status });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const id = searchParams.get("id");

    if (!type || !id) {
      return NextResponse.json({ error: "Type and ID are required" }, { status: 400 });
    }

    if (type === "category") {
      await prisma.sawalJawabCategory.delete({ where: { id } });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    if (type === "item") {
      await prisma.sawalJawab.delete({ where: { id } });
      return NextResponse.json({ success: true }, { status: 200 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    console.error("Admin SawalJawab DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
