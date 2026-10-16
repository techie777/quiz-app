import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request, { params }) {
  const { slug, chapterSlug } = params;

  try {
    const chapter = await prisma.studyChapter.findFirst({
      where: { 
        slug: chapterSlug,
        subject: {
          material: {
            slug: slug
          }
        }
      },
      include: {
        practice: {
          select: { id: true, title: true }
        },
        subject: {
          include: {
            material: true
          }
        }
      }
    });

    if (!chapter) {
      return NextResponse.json({ error: "Chapter not found" }, { status: 404 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("Error fetching study chapter:", error);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
