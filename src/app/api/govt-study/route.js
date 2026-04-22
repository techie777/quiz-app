import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    console.error("Error fetching study materials:", error);
    return NextResponse.json({ error: "Failed to fetch study materials" }, { status: 500 });
  }
}
