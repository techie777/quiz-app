import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const sections = await prisma.section.findMany({
      where: {
        isVisible: true,
      },
      include: {
        subSections: {
          where: {
            isVisible: true,
          },
          orderBy: {
            order: "asc",
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

    return NextResponse.json(sections);
  } catch (error) {
    console.error("Failed to fetch public sections:", error);
    
    // Fallback sections data when database is unavailable
    const fallbackSections = [
      {
        id: "section-1",
        name: "Educational Quizzes",
        isVisible: true,
        order: 1,
        subSections: [
          {
            id: "subsection-1",
            name: "Science & Technology",
            isVisible: true,
            order: 1,
            quizIds: ["fallback-1", "fallback-4"],
            sectionId: "section-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: "subsection-2", 
            name: "Humanities",
            isVisible: true,
            order: 2,
            quizIds: ["fallback-2", "fallback-3"],
            sectionId: "section-1",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: "section-2",
        name: "Entertainment",
        isVisible: true,
        order: 2,
        subSections: [
          {
            id: "subsection-3",
            name: "Sports & Games",
            isVisible: true,
            order: 1,
            quizIds: ["fallback-5"],
            sectionId: "section-2",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
      }
    ];
    
    // Log to monitoring service in production
    return NextResponse.json(fallbackSections);
  }
}
