import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request, { params }) {
  const { slug } = params;

  try {
    const material = await prisma.studyMaterial.findUnique({
      where: { slug: slug },
      include: {
        subjects: {
          orderBy: { sortOrder: 'asc' },
          include: {
            chapters: {
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!material) {
      return NextResponse.json({ error: "Study material not found" }, { status: 404 });
    }

    return NextResponse.json(material);
  } catch (error) {
    console.error("Error fetching study material detail:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
