import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    const materials = await prisma.studyMaterial.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { subjects: true }
        }
      }
    });
    return NextResponse.json(materials);
  } catch (error) {
    console.error("Admin Fetch StudyMaterials Error:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { id, name, slug, image, description, authors, alignedTo } = data;

    let material;
    if (id) {
      material = await prisma.studyMaterial.update({
        where: { id },
        data: { name, slug, image, description, authors, alignedTo }
      });
    } else {
      material = await prisma.studyMaterial.create({
        data: { name, slug, image, description, authors, alignedTo }
      });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Admin Save StudyMaterial Error:", error);
    return NextResponse.json({ error: "Failed to save study material" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.studyMaterial.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin Delete StudyMaterial Error:", error);
    return NextResponse.json({ error: "Failed to delete material" }, { status: 500 });
  }
}
